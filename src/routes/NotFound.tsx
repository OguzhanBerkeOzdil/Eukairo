import { Link } from 'react-router-dom';
import { BiError } from 'react-icons/bi';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const NotFound = () => {
  return (
    <div className="min-h-screen p-6 lg:p-8 relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 z-0 opacity-30 dark:opacity-100"></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      
      <div className="relative z-10 flex-1 flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <BiError className="w-24 h-24 text-primary mx-auto mb-6 opacity-80" />
          <h1 className="text-4xl font-bold text-text-light dark:text-text-dark mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-subtext-light dark:text-subtext-dark mb-8">
            The page you're looking for doesn't exist.
          </p>
          <Link 
            to="/" 
            className="inline-block bg-primary text-gray-900 font-bold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Go Home
          </Link>
        </main>
        <Footer />
      </div>
    </div>
  );
};
