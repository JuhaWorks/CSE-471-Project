import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Ghost } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#080812] flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-8">
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-2xl"
            >
              <Ghost size={64} className="text-accent-500" />
            </motion.div>
          </div>

          <h1 className="text-8xl font-black text-white mb-2 tracking-tighter">
            4<span className="text-accent-500 italic">0</span>4
          </h1>
          <h2 className="text-2xl font-bold text-white mb-4">Lost in Orbit?</h2>
          <p className="text-white/60 mb-10 leading-relaxed">
            The page you're looking for has drifted into deep space. 
            Don't worry, even the best navigators lose their way sometimes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-8 py-4 bg-accent-500 text-[#080812] font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(0,229,160,0.4)]"
              >
                <Home size={20} />
                Return Home
              </motion.button>
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-2xl border border-white/10 flex items-center justify-center gap-2 transition-all backdrop-blur-md"
            >
              <ArrowLeft size={20} />
              Go Back
            </button>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="mt-16 text-white/20 text-sm font-medium tracking-widest uppercase flex items-center justify-center gap-4">
          <div className="h-px w-8 bg-white/10" />
          Klivra Deep Space Exploration
          <div className="h-px w-8 bg-white/10" />
        </div>
      </div>
    </div>
  );
};

export default NotFound;
