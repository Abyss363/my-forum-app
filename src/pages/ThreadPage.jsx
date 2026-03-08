import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, addDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Footer from '../components/Footer'

function ThreadPage({ userProfile, user }) {
    const { threadId } = useParams()
    const navigate = useNavigate()
    const [thread, setThread] = useState(null)
    const [loading, setLoading] = useState(true)
    const [replies, setReplies] = useState([])
    const [replyBody, setReplyBody] = useState('')
    const [replyError, setReplyError] = useState('')
    const [replyLoading, setReplyLoading] = useState(false)

    useEffect(() => {
        async function fetchThread() {
            const docRef = doc(db, 'threads', threadId)
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
                setThread({ id: docSnap.id, ...docSnap.data() })
            }
            setLoading(false)
        }
        fetchThread()
    }, [threadId])

    useEffect(() => {
        const q = query(
            collection(db, 'threads', threadId, 'replies'),
            orderBy('createdAt', 'asc')
        )
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const replyList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }))
            setReplies(replyList)
        })
        return () => unsubscribe()
    }, [threadId])

    async function handleReply() {
        if (!replyBody.trim()) {
            setReplyError('Reply cannot be empty.')
            return
        }
        setReplyLoading(true)
        try {
            await addDoc(collection(db, 'threads', threadId, 'replies'), {
                body: replyBody,
                authorName: userProfile.displayName,
                authorRole: userProfile.role,
                authorId: user.uid,
                createdAt: serverTimestamp(),
                upvotes: 0,
            })
            setReplyBody('')
            setReplyError('')
        } catch (err) {
            setReplyError(err.message)
        }
        setReplyLoading(false)
    }

    async function handleUpvote(reply) {
        const replyRef = doc(db, 'threads', threadId, 'replies', reply.id)
        const alreadyUpvoted = reply.upvotedBy?.includes(user.uid)

        if (reply.authorId === user.uid) {
            return
        }

        await updateDoc(replyRef, {
            upvotes: alreadyUpvoted ? reply.upvotes - 1 : reply.upvotes + 1,
            upvotedBy: alreadyUpvoted ? arrayRemove(user.uid) : arrayUnion(user.uid)
        })
    }

    async function handleDeleteReply(replyId) {
        if (window.confirm('Are you sure you want to delete this reply?')) {
            await deleteDoc(doc(db, 'threads', threadId, 'replies', replyId))
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-blue-50 flex items-center justify-center">
                <p className="text-blue-600 text-xl font-bold">Loading...</p>
            </div>
        )
    }

    if (!thread) {
        return (
            <div className="min-h-screen bg-blue-50 flex items-center justify-center">
                <p className="text-red-500 text-xl font-bold">Thread not found.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-blue-50 flex flex-col">
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-700">🎓 AJUFORUM</h1>
                <button
                    onClick={() => navigate('/')}
                    className="text-blue-600 font-bold hover:underline"
                >
                    🔙 Back
                </button>
            </nav>

            <div className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">{thread.title}</h2>
                        {thread.pinned && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-1 rounded-full">
                                📌 Pinned
                            </span>
                        )}
                    </div>
                    <p className="text-gray-700 mb-6 leading-relaxed">{thread.body}</p>
                    <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-4">
                        <span>
                            Posted by{' '}
                            <span className={`font-bold ${thread.authorRole === 'lecturer' ? 'text-green-600' : 'text-blue-600'}`}>
                                {thread.authorName}
                            </span>
                            {thread.authorRole === 'lecturer' && '🎓'}
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

                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-gray-700">
                        {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                    </h3>

                    {replies.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400">
                            No replies yet. Be the first to reply!
                        </div>
                    ) : (
                        replies.map((reply) => (
                            <div key={reply.id} className="bg-white rounded-2xl shadow p-6 relative">
                                <p className="text-gray-700 mb-4 leading-relaxed">{reply.body}</p>
                                <button
                                    onClick={() => handleUpvote(reply)}
                                    disabled={reply.authorId === user.uid}
                                    className={`flex items-center gap-2 text-sm font-bold py-1 px-4 rounded-full transition-colors duration-400
                                            ${reply.upvotedBy?.includes(user.uid)
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'}
                                            ${reply.authorId === user.uid
                                            ? 'opacity-40 cursor-not-allowed'
                                            : 'cursor-pointer'}`}>
                                    👍 <span>{reply.upvotes || 0}</span>
                                </button>
                                <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-3 mt-3 gap-2">
                                    <span>
                                        <span className={`font-bold ${reply.authorRole === 'lecturer' ? 'text-green-600' : 'text-blue-600'}`}>
                                            {reply.authorName}
                                        </span>
                                        {reply.authorRole === 'lecturer' && '👨‍🏫'}
                                    </span>
                                    <span>
                                        {reply.createdAt?.toDate().toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </span>

                                    {(userProfile.role === 'lecturer' || reply.authorId === user.uid) && (
                                        <button
                                            onClick={() => handleDeleteReply(reply.id)}
                                            className="text-xs font-bold py-1 px-3 rounded-full border-2 border-red-400 text-red-400 hover:bg-red-50 transition-colors duration-200"
                                            >
                                                🗑️ Delete
                                            </button>
                                    )
                                        
                                    }
                                </div>
                            </div>
                        ))
                    )}

                    <div className="bg-white rounded-2xl shadow p-6">
                        <h4 className="text-md font-bold text-gray-700 mb-3">Post a Reply</h4>
                        {replyError && (
                            <p className="text-red-500 text-sm mb-3">{replyError}</p>
                        )}

                        <textarea
                            placeholder="Write your reply here..."
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            rows={4}
                            className="w-full border border-gray-300 rounded-lg p-3 mb-3 outline-none focus:border-blue-500 resize-none"
                        />

                        <button
                            onClick={handleReply}
                            disabled={replyLoading}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {replyLoading ? 'Posting...' : 'Post Reply'}
                        </button>
                    </div>
                </div>
            </div>
            <Footer user={user} userProfile={userProfile} />
        </div>
    )
}

export default ThreadPage