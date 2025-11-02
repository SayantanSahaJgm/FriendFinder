import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import Peer from 'simple-peer';

const VideoCall = ({ friend, onEnd }) => {
  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const { socket } = useSocket();

  const myVideo = useRef();
  const userVideo = useRef();
  const peerRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      })
      .catch((err) => {
        console.error('Failed to get user media:', err);
        alert('Could not access camera/microphone. Please enable camera/microphone permissions in your browser settings and reload the page.');
      });

    if (socket) {
      socket.on('call-accepted', handleCallAccepted);
      socket.on('call-rejected', handleCallRejected);
      socket.on('call-ended', handleCallEnded);
      socket.on('incoming-call', handleIncomingCall);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (socket) {
        socket.off('call-accepted', handleCallAccepted);
        socket.off('call-rejected', handleCallRejected);
        socket.off('call-ended', handleCallEnded);
        socket.off('incoming-call', handleIncomingCall);
      }
    };
  }, [socket]);

  useEffect(() => {
    if (stream && socket && friend) {
      // Initiate call
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
      });

      peer.on('signal', (signal) => {
        socket.emit('call-user', {
          to: friend._id,
          signal,
          from: socket.userId,
        });
      });

      peer.on('stream', (remoteStream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = remoteStream;
        }
      });

      peerRef.current = peer;
    }
  }, [stream, socket, friend]);

  const handleCallAccepted = ({ signal }) => {
    setCallAccepted(true);
    if (peerRef.current) {
      peerRef.current.signal(signal);
    }
  };

  const handleCallRejected = () => {
    alert('Call was rejected');
    endCall();
  };

  const handleCallEnded = () => {
    endCall();
  };

  const handleIncomingCall = ({ signal, from }) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (signalData) => {
      socket.emit('accept-call', {
        to: from,
        signal: signalData,
      });
    });

    peer.on('stream', (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    peer.signal(signal);
    setCallAccepted(true);
    peerRef.current = peer;
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  };

  const endCall = () => {
    if (socket && friend) {
      socket.emit('end-call', { to: friend._id });
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    setCallEnded(true);
    onEnd();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="w-full h-full max-w-6xl p-4">
        <div className="relative h-full">
          {/* Remote Video */}
          <video
            ref={userVideo}
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-lg"
          />

          {/* Local Video */}
          <video
            ref={myVideo}
            autoPlay
            playsInline
            muted
            className="absolute bottom-4 right-4 w-64 h-48 object-cover rounded-lg border-2 border-white"
          />

          {/* Call Status */}
          {!callAccepted && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg">
              <p className="text-gray-800">Calling {friend.name}...</p>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full ${
                videoEnabled ? 'bg-blue-500' : 'bg-red-500'
              } text-white hover:opacity-80`}
            >
              {videoEnabled ? '📹' : '🚫📹'}
            </button>
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full ${
                audioEnabled ? 'bg-blue-500' : 'bg-red-500'
              } text-white hover:opacity-80`}
            >
              {audioEnabled ? '🎤' : '🚫🎤'}
            </button>
            <button
              onClick={endCall}
              className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700"
            >
              ❌ End Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
