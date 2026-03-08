import { auth, db } from '../firebase'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import CreateThread from './CreateThread'
import Footer from '../components/Footer'

function Home({ userProfile, user }) {

    const navigate = useNavigate()
    const [showCreate, setShowCreate] = useState(false)
    const [threads, setThreads] = useState([])

    useEffect(() => {
        const q = query(
            collection(db, 'threads'),
            orderBy('pinned', 'desc'),
            orderBy('createdAt', 'desc')
        )
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const threadList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }))
            setThreads(threadList)
        })
        return () => unsubscribe()
    }, [])

    async function handlePin(thread) {
        const threadRef = doc(db, 'threads', thread.id)
        await updateDoc(threadRef, {
            pinned: !thread.pinned
        })
    }

    async function handleDeleteThread(threadId) {
        if (window.confirm('Are you sure you want to delete this thread?')) {
            await deleteDoc(doc(db, 'threads', threadId))
        }
    }

    if (showCreate) {
        return <CreateThread userProfile={userProfile} user={user} onBack={() => setShowCreate(false)} />
    }

    return (
        <div className="min-h-screen bg-blue-50 flex flex-col">
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-700">🎓AJU FORUM</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-600 text-sm">
                        {userProfile.displayName}{' '}
                        <span className={`font-bold ${userProfile.role === 'lecturer' ? 'text-green-600' : 'text-blue-600'}`}>
                            ({userProfile.role})
                        </span>
                    </span>
                    <button
                        onClick={() => auth.signOut()}
                        className="bg-red-500 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-red-600">
                        Log Out
                    </button>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-700">Discussion Threads</h2>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                        + New Thread
                    </button>
                </div>

                {threads.length === 0 ?
                    (
                        <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400">
                            No threads yet. Be the first to post!
                        </div>
                    ) :
                    (
                        <div className="flex flex-col gap-4">
                            {threads.map((thread) => (
                                <div key={thread.id}
                                    className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 
                                        onClick={() => navigate(`/thread/${thread.id}`)}
                                        className="text-lg font-bold text-gray-800 cursor-pointer hover:text-blue-600">
                                            {thread.title}
                                        </h3>
                                    
                                    <div>
                                        {thread.pinned && (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-1 rounded-full">
                                                📌 Pinned
                                            </span>
                                        )}
                                        {userProfile.role === 'lecturer' && (
                                            <button
                                                onClick={() => handlePin(thread)}
                                                className={`text-xs font-bold py-1 px-3 rounded-full border-2 transition-colors duration-200
                                                ${thread.pinned
                                                    ? 'bg-yellow-400 text-white border-yellow-400 hover:bg-yellow-500'
                                                    : 'bg-white text-yellow-500 border-yellow-400 hover:bg-yellow-50'
                                                }`}>
                                                    {thread.pinned ? 'Unpin' : 'Pin'}
                                                </button>
                                        )}
                                        {(userProfile.role === 'lecturer' || thread.authorId === user.uid) && (
                                            <button
                                                onClick={() => handleDeleteThread(thread.id)}
                                                className="text-xs font-bold py-1 px-3 rounded-full border-2 border-red-400 text-red-400 hover:bg-red-50 transition-colors duration-200"
                                                >
                                                    🗑️ Delete
                                                </button>
                                        )}
                                    </div>
                                        
                                    </div>
                                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{thread.body}</p>
                                    <div className="flex justify-between items-center text-xs text-gray-400">
                                        <span>
                                            Posted by{' '}
                                            <span className={`font-bold ${thread.authorRole === 'lecturer' ? 'text-green-600' : 'text-blue-600'}`}>
                                                {thread.authorName}
                                            </span>
                                            {thread.authorRole === 'lecturer' && '👨‍🏫'}
                                        </span>
                                        <span>
                                            {thread.createdAt?.toDate().toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )

                }
            </div>

                <Footer user={user} userProfile={userProfile} />
        </div>
    )
}

export default Home