import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import Peer from 'simple-peer';

const VideoCall = ({ friend, onClose }) => {
  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [calling, setCalling] = useState(false);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState('');
  const [callerSignal, setCallerSignal] = useState(null);
  const [callType, setCallType] = useState('video'); // 'audio' or 'video'

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('incoming_call', (data) => {
        setReceivingCall(true);
        setCaller(data.from);
        setCallerSignal(data.signal);
        setCallType(data.callType || 'video');
      });

      socket.on('call_accepted', (data) => {
        setCallAccepted(true);
        connectionRef.current.signal(data.signal);
      });

      socket.on('call_rejected', () => {
        alert('Call was rejected');
        endCall();
      });

      socket.on('call_ended', () => {
        endCall();
      });

      return () => {
        socket.off('incoming_call');
        socket.off('call_accepted');
        socket.off('call_rejected');
        socket.off('call_ended');
      };
    }
  }, [socket]);

  const startCall = async (type = 'video') => {
    try {
      setCallType(type);
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true,
      });

      setStream(currentStream);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }

      setCalling(true);

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: currentStream,
      });

      peer.on('signal', (data) => {
        socket.emit('call_user', {
          userToCall: friend._id,
          signalData: data,
          from: socket.id,
          name: 'You',
          callType: type,
        });
      });

      peer.on('stream', (currentStream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = currentStream;
        }
      });

      connectionRef.current = peer;
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Failed to access camera/microphone');
    }
  };

  const answerCall = async () => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true,
      });

      setStream(currentStream);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }

      setCallAccepted(true);

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: currentStream,
      });

      peer.on('signal', (data) => {
        socket.emit('answer_call', {
          signal: data,
          to: caller,
        });
      });

      peer.on('stream', (currentStream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = currentStream;
        }
      });

      peer.signal(callerSignal);
      connectionRef.current = peer;
      setReceivingCall(false);
    } catch (error) {
      console.error('Error answering call:', error);
      alert('Failed to access camera/microphone');
    }
  };

  const rejectCall = () => {
    socket.emit('reject_call', { to: caller });
    setReceivingCall(false);
  };

  const endCall = () => {
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (socket && friend) {
      socket.emit('end_call', { to: friend._id });
    }
    // Reset states and close modal
    setCallAccepted(false);
    setCalling(false);
    setReceivingCall(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-screen overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            {receivingCall ? 'Incoming Call' : 'Video Call with ' + friend?.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {receivingCall && !callAccepted && (
          <div className="text-center space-y-4">
            <p className="text-xl">
              {callType === 'video' ? 'Video' : 'Audio'} call incoming...
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={answerCall}
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
              >
                Answer
              </button>
              <button
                onClick={rejectCall}
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {!calling && !callAccepted && !receivingCall && (
          <div className="text-center space-y-4">
            <p className="text-lg mb-4">Start a call with {friend?.name}</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => startCall('video')}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
              >
                📹 Video Call
              </button>
              <button
                onClick={() => startCall('audio')}
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
              >
                🎤 Audio Call
              </button>
            </div>
          </div>
        )}

        {(stream || calling) && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-center mb-2">You</p>
                <video
                  ref={myVideo}
                  autoPlay
                  muted
                  playsInline
                  className="w-full rounded-lg bg-gray-200"
                />
              </div>
              {callAccepted && (
                <div>
                  <p className="text-center mb-2">{friend?.name}</p>
                  <video
                    ref={userVideo}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg bg-gray-200"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-center">
              <button
                onClick={endCall}
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
              >
                End Call
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
