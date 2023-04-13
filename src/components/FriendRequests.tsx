"use client"
import { pusherClint } from '@/lib/pusher'
import { toPusherKey } from '@/lib/utils'
import axios from 'axios'
import { Check, UserPlus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'

interface FriendRequestsProps {
    incomingFriendRequests: IncomingFriendRequest[],
    sessionId: string
}

const FriendRequests: FC<FriendRequestsProps> = ({ incomingFriendRequests, sessionId }) => {
    const [friendRequests, setFriendRequests] = useState<IncomingFriendRequest[]>(incomingFriendRequests)

    const router = useRouter();

    useEffect(() => {
        pusherClint.subscribe(
            toPusherKey(`user:${sessionId}:incoming_friend_requests`)
        )

        const friendRequestHandler = ({senderId, senderEmail}: IncomingFriendRequest) => {
            setFriendRequests((prev) => [...prev, {senderId, senderEmail}])
        }

        pusherClint.bind("incoming_friend_requests", friendRequestHandler)

        return () => {
            pusherClint.unsubscribe(
                toPusherKey(`user:${sessionId}:incoming_friend_requests`)
            )
            pusherClint.unbind("incoming_friend_requests", friendRequestHandler)
        }

    }, [sessionId])

    const acceptFriend = async (senderId: string) => {
        await axios.post("/api/requests/accept", { id: senderId })

        setFriendRequests((prev) => prev.filter((req) => req.senderId !== senderId))
        router.refresh();
    }

    const denyFriend = async (senderId: string) => {
        await axios.post("/api/requests/deny", { id: senderId })

        setFriendRequests((prev) => prev.filter((req) => req.senderId !== senderId))
        router.refresh();
    }

    return <>
        {friendRequests.length === 0 ? (
            <p className='text-sm text-zinc-500'>Nothing to show here...</p>
        ) : (
            friendRequests.map((req) => (
                <div key={req.senderId} className='flex gap-4 items-center'>
                    <UserPlus className='text-black' />
                    <p className='font-medium text-lg'>{req.senderEmail}</p>
                    <button
                        aria-label='accept friend'
                        className='w-8 h-8 bg-indigo-600 hover:bg-indigo-700 grid place-items-center transition hover:shadow-md rounded-full'
                        onClick={() => acceptFriend(req.senderId)}
                    >
                        <Check className='font-semibold text-white w-3/4 h-3/4' />
                    </button>
                    <button
                        aria-label='denied friend'
                        className='w-8 h-8 bg-red-600 hover:bg-red-700 grid place-items-center transition hover:shadow-md rounded-full'
                        onClick={() => denyFriend(req.senderId)}
                    >
                        <X className='font-semibold text-white w-3/4 h-3/4' />
                    </button>
                </div>
            ))
        )}
    </>
}

export default FriendRequests