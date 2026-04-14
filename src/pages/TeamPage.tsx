import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { User } from 'firebase/auth';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Game {
  id: string;
  team: string;
  date: any;
  opponent: string;
  location: string;
}

interface Signup {
  id: string;
  playerName: string;
  status: string;
  createdAt: any;
  comment?: string;
}

export default function TeamPage({ user }: { user: User | null }) {
  const { teamId } = useParams<{ teamId: string }>();
  const teamName = teamId === 'jyllandsserie' ? 'Jyllandsserie' : '2.division';
  
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalPlayerName, setGlobalPlayerName] = useState(() => localStorage.getItem('savedPlayerName') || '');
  const [displayTeamName, setDisplayTeamName] = useState(teamName);

  const handleNameChange = (name: string) => {
    setGlobalPlayerName(name);
    localStorage.setItem('savedPlayerName', name);
  };

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (teamId === 'jyllandsserie' && data.team1Name) {
          setDisplayTeamName(data.team1Name);
        } else if (teamId !== 'jyllandsserie' && data.team2Name) {
          setDisplayTeamName(data.team2Name);
        }
      }
    });

    const q = query(
      collection(db, 'games'),
      where('team', '==', teamName),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Game[];
      setGames(gamesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'games');
      setLoading(false);
    });

    return () => {
      unsubscribeSettings();
      unsubscribe();
    };
  }, [teamName, teamId]);

  if (loading) {
    return <div className="text-center py-12">Henter kampe...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{displayTeamName} Kampe</h1>
      
      {games.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Ingen planlagte kampe.
        </div>
      ) : (
        <div className="space-y-8">
          {games.map(game => (
            <GameCard 
              key={game.id} 
              game={game} 
              playerName={globalPlayerName}
              onNameChange={handleNameChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GameCard({ 
  game, 
  playerName,
  onNameChange
}: { 
  game: Game, 
  playerName: string,
  onNameChange: (name: string) => void
}) {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, `games/${game.id}/signups`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const signupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Signup[];
      setSignups(signupsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `games/${game.id}/signups`);
    });

    return () => unsubscribe();
  }, [game.id]);

  const handleSignup = async (status: 'in' | 'out') => {
    if (!playerName.trim()) return;
    setIsSubmitting(true);
    try {
      const signupData: any = {
        playerName: playerName.trim(),
        status,
        createdAt: serverTimestamp()
      };
      if (comment.trim()) {
        signupData.comment = comment.trim();
      }
      await addDoc(collection(db, `games/${game.id}/signups`), signupData);
      setComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `games/${game.id}/signups`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSignup = async (signupId: string) => {
    try {
      await deleteDoc(doc(db, `games/${game.id}/signups`, signupId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `games/${game.id}/signups/${signupId}`);
    }
  };

  const gameDate = game.date?.toDate ? game.date.toDate() : new Date();
  const inPlayers = signups.filter(s => s.status === 'in');
  const outPlayers = signups.filter(s => s.status === 'out');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div 
        className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="text-xl font-bold text-gray-900">Silkeborg vs {game.opponent}</h3>
          <p className="text-sm text-gray-600 mt-1 capitalize">
            {format(gameDate, 'EEEE, d. MMMM yyyy', { locale: da })} kl. {format(gameDate, 'HH:mm')}
          </p>
          <p className="text-sm text-gray-600">Sted: {game.location}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">{inPlayers.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Deltager</div>
          </div>
          <div className="text-gray-400">
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        </div>
      </div>

      {isExpanded && (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Signups List */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Deltager ({inPlayers.length})
            </h4>
            <ul className="space-y-2 mb-6">
              {inPlayers.length === 0 && <li className="text-sm text-gray-500 italic">Ingen endnu</li>}
              {inPlayers.map(signup => (
                <li key={signup.id} className="text-sm text-gray-800 flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                  <div>
                    <span className="font-medium">{signup.playerName}</span>
                    {signup.comment && <span className="text-gray-500 ml-2 italic">- {signup.comment}</span>}
                  </div>
                  <button onClick={() => handleDeleteSignup(signup.id)} className="text-red-500 hover:text-red-700 text-xs">
                    Fjern
                  </button>
                </li>
              ))}
            </ul>

            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Deltager ikke ({outPlayers.length})
            </h4>
            <ul className="space-y-2">
              {outPlayers.length === 0 && <li className="text-sm text-gray-500 italic">Ingen endnu</li>}
              {outPlayers.map(signup => (
                <li key={signup.id} className="text-sm text-gray-800 flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                  <div>
                    <span className="font-medium">{signup.playerName}</span>
                    {signup.comment && <span className="text-gray-500 ml-2 italic">- {signup.comment}</span>}
                  </div>
                  <button onClick={() => handleDeleteSignup(signup.id)} className="text-red-500 hover:text-red-700 text-xs">
                    Fjern
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Signup Form */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-4">Tilføj dit navn</h4>
            <div className="space-y-4">
              <div>
                <label htmlFor={`name-${game.id}`} className="sr-only">Dit Navn</label>
                <input
                  id={`name-${game.id}`}
                  type="text"
                  placeholder="Indtast dit fulde navn"
                  value={playerName}
                  onChange={(e) => onNameChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor={`comment-${game.id}`} className="sr-only">Kommentar (valgfri)</label>
                <input
                  id={`comment-${game.id}`}
                  type="text"
                  placeholder="Kommentar (valgfri, f.eks. 'Spiller første kamp')"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSignup('in')}
                  disabled={!playerName.trim() || isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50 transition-colors"
                >
                  Deltager
                </button>
                <button
                  onClick={() => handleSignup('out')}
                  disabled={!playerName.trim() || isSubmitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50 transition-colors"
                >
                  Deltager ikke
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
