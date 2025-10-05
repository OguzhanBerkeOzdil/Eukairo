import { BiWifi } from 'react-icons/bi';

export const Offline = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-30 dark:opacity-100"></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      
      <div className="relative z-10 text-center max-w-md">
        <BiWifi className="w-24 h-24 text-primary mx-auto mb-6 opacity-80" />
        <h1 className="text-4xl font-bold text-text-light dark:text-text-dark mb-4">
          You're Offline
        </h1>
        <p className="text-lg text-subtext-light dark:text-subtext-dark mb-8">
          Eukairo works offline. Your data is safe on this device.
        </p>
        <button 
          onClick={handleRefresh}
          className="inline-block bg-primary text-gray-900 font-bold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};
