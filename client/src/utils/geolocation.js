export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        }
      );
    }
  });
};

export const watchPosition = (callback, errorCallback) => {
  if (!navigator.geolocation) {
    errorCallback(new Error('Geolocation is not supported by your browser'));
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    errorCallback
  );
};

export const clearWatch = (watchId) => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};
