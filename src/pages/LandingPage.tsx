import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export default function LandingPage() {
  const [team1Name, setTeam1Name] = useState('Jyllandsserie');
  const [team2Name, setTeam2Name] = useState('2. division');

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTeam1Name(data.team1Name || 'Jyllandsserie');
        setTeam2Name(data.team2Name || '2. division');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/general');
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <img 
        src="/logo.png" 
        alt="Silkeborg Volleyball Logo" 
        className="w-48 h-48 mb-8 object-contain"
      />
      <h1 className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4 leading-normal text-center">
        Silkeborg Volleyball
      </h1>
      <p className="text-lg text-gray-600 mb-12 text-center max-w-md">
        Vælg dit hold og meld dig til kampene.
      </p>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
        <Link 
          to="/team/jyllandsserie"
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white text-center py-4 px-6 rounded-xl text-xl font-semibold transition-all shadow-md"
        >
          {team1Name}
        </Link>
        <Link 
          to="/team/2-division"
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white text-center py-4 px-6 rounded-xl text-xl font-semibold transition-all shadow-md"
        >
          {team2Name}
        </Link>
      </div>
    </div>
  );
}
