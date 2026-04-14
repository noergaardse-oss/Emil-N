import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface Game {
  id: string;
  team: string;
  date: any;
  opponent: string;
  location: string;
}

interface CustomUser {
  username: string;
  isAdmin: boolean;
}

export default function AdminPage({ user }: { user: CustomUser | null }) {
  const [team, setTeam] = useState('Jyllandsserie');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [opponent, setOpponent] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [team1Name, setTeam1Name] = useState('Jyllandsserie');
  const [team2Name, setTeam2Name] = useState('2. division');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTeam1Name(data.team1Name || 'Jyllandsserie');
        setTeam2Name(data.team2Name || '2. division');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/general');
    });

    const q = query(collection(db, 'games'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Game[];
      setGames(gamesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'games');
    });
    return () => {
      unsubscribeSettings();
      unsubscribe();
    };
  }, []);

  if (!user || !user.isAdmin) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Adgang nægtet</h2>
        <p className="text-gray-600 mt-2">Du skal være logget ind som administrator for at se denne side.</p>
      </div>
    );
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team1Name.trim() || !team2Name.trim()) return;
    
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        team1Name: team1Name.trim(),
        team2Name: team2Name.trim()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/general');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !opponent || !location) return;
    
    setIsSubmitting(true);
    try {
      const dateTimeString = `${date}T${time}:00`;
      const gameDate = new Date(dateTimeString);
      
      await addDoc(collection(db, 'games'), {
        team,
        date: gameDate,
        opponent,
        location,
        createdAt: serverTimestamp()
      });
      
      setDate('');
      setTime('');
      setOpponent('');
      setLocation('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'games');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    try {
      await deleteDoc(doc(db, 'games', gameId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `games/${gameId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Kontrolpanel</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Forsideknapper</h2>
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Knap 1 (Hold 1)</label>
              <input 
                type="text" 
                value={team1Name} 
                onChange={(e) => setTeam1Name(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Knap 2 (Hold 2)</label>
              <input 
                type="text" 
                value={team2Name} 
                onChange={(e) => setTeam2Name(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isSavingSettings || !team1Name.trim() || !team2Name.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md font-medium disabled:opacity-50 transition-colors"
          >
            {isSavingSettings ? 'Gemmer...' : 'Gem navne'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Tilføj ny kamp</h2>
        <form onSubmit={handleAddGame} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hold</label>
              <select 
                value={team} 
                onChange={(e) => setTeam(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Jyllandsserie">{team1Name}</option>
                <option value="2.division">{team2Name}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modstander</label>
              <input 
                type="text" 
                value={opponent} 
                onChange={(e) => setOpponent(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dato</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tid (f.eks. 19:30)</label>
              <input 
                type="text" 
                pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                placeholder="19:30"
                title="Indtast tid i 24-timers format (HH:MM)"
                value={time} 
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sted</label>
              <input 
                type="text" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white py-2 px-6 rounded-md font-medium disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Tilføjer...' : 'Tilføj kamp'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Administrer kampe</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-600">
                <th className="pb-3 font-medium">Dato</th>
                <th className="pb-3 font-medium">Hold</th>
                <th className="pb-3 font-medium">Kamp</th>
                <th className="pb-3 font-medium">Sted</th>
                <th className="pb-3 font-medium text-right">Handlinger</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {games.map(game => {
                const gameDate = game.date?.toDate ? game.date.toDate() : new Date();
                const displayTeam = game.team === 'Jyllandsserie' ? team1Name : 
                                    game.team === '2.division' ? team2Name : game.team;
                return (
                  <tr key={game.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 capitalize">{format(gameDate, 'd. MMM yyyy HH:mm', { locale: da })}</td>
                    <td className="py-3">{displayTeam}</td>
                    <td className="py-3">Silkeborg vs {game.opponent}</td>
                    <td className="py-3">{game.location}</td>
                    <td className="py-3 text-right">
                      <button 
                        onClick={() => handleDeleteGame(game.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Slet
                      </button>
                    </td>
                  </tr>
                );
              })}
              {games.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">Ingen kampe fundet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
