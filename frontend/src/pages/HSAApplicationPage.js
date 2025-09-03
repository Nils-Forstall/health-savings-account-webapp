import React from 'react';
import HSAApplication from '../components/hsa/HSAApplication';

const HSAApplicationPage = ({ user, onSuccess, addToast, setLoading, loading }) => {
  return (
    <HSAApplication
      user={user}
      onSuccess={onSuccess}
      addToast={addToast}
      setLoading={setLoading}
      loading={loading}
    />
  );
};

export default HSAApplicationPage;
