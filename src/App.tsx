import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider } from './state/SessionProvider';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Landing } from './routes/Landing';
import { GoalSelect } from './routes/GoalSelect';
import { Session } from './routes/Session';
import { Rate } from './routes/Rate';
import { Insights } from './routes/Insights';
import { About } from './routes/About';
import { Techniques } from './routes/Techniques';
import { HowItWorks } from './routes/HowItWorks';
import { NotFound } from './routes/NotFound';

function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/" element={
            <div className="min-h-screen p-6 lg:p-8 relative overflow-hidden flex flex-col">
              <div className="absolute inset-0 z-0 opacity-30 dark:opacity-100"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none"></div>
              <div className="relative z-10 flex-1 flex flex-col">
                <Header />
                <Landing />
                <Footer />
              </div>
            </div>
          } />
          <Route path="/goals" element={<GoalSelect />} />
          <Route path="/how-it-works" element={
            <div className="min-h-screen p-6 lg:p-8 relative overflow-hidden flex flex-col">
              <div className="relative z-10 flex-1 flex flex-col">
                <Header />
                <HowItWorks />
                <Footer />
              </div>
            </div>
          } />
          <Route path="/session" element={<Session />} />
          <Route path="/rate" element={<Rate />} />
          <Route path="/insights" element={
            <div className="min-h-screen p-6 lg:p-8 relative overflow-hidden flex flex-col">
              <div className="relative z-10 flex-1 flex flex-col">
                <Header />
                <Insights />
                <Footer />
              </div>
            </div>
          } />
          <Route path="/about" element={
            <div className="min-h-screen p-6 lg:p-8 relative overflow-hidden flex flex-col">
              <div className="relative z-10 flex-1 flex flex-col">
                <Header />
                <About />
                <Footer />
              </div>
            </div>
          } />
          <Route path="/techniques" element={
            <div className="min-h-screen p-6 lg:p-8 relative overflow-hidden flex flex-col">
              <div className="relative z-10 flex-1 flex flex-col">
                <Header />
                <Techniques />
                <Footer />
              </div>
            </div>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}

export default App;
