"use client"
import { pusherClint } from '@/lib/pusher'
import { chatHrefConstructor, toPusherKey } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import UnseenChatToast from './UnseenChatToast'

interface SidebarChatListProps {
    friends: User[],
    sessionId: string
}

interface ExtendedMessage extends Message {
    senderImg: string,
    senderName: string
}

const SidebarChatList: FC<SidebarChatListProps> = ({ friends, sessionId }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [unseenMessages, setUnseenMessages] = useState<Message[]>([])
    useEffect(() => {
        pusherClint.subscribe(toPusherKey(`user:${sessionId}:chats`))
        pusherClint.subscribe(toPusherKey(`user:${sessionId}:friends`))

        const newFriendHandler = () => {
            router.refresh();
        }

        const chatHandler = (message: ExtendedMessage) => {
            const shouldNotify = pathname !== `/dashboard/chat/${chatHrefConstructor(sessionId, message.senderId)}`

            if (!shouldNotify) return

            toast.custom((t) => (
                //custom toast
                <UnseenChatToast
                    senderId={message.senderId}
                    t={t}
                    sessionId={sessionId}
                    senderMessage={message.text}
                    senderImg={message.senderImg}
                    senderName={message.senderName}
                />
            ))

            setUnseenMessages((prev) => [...prev, message])
        }

        pusherClint.bind("new_message", chatHandler)
        pusherClint.bind("new_friend", newFriendHandler)

        return () => {
            pusherClint.unsubscribe(toPusherKey(`user:${sessionId}:chats`))
            pusherClint.unsubscribe(toPusherKey(`user:${sessionId}:friends`))

            pusherClint.unbind("new_message", chatHandler)
            pusherClint.unbind("new_friend", newFriendHandler)
        }

    }, [pathname, router, sessionId])
    
    useEffect(() => {
        if (pathname?.includes("chat")) {
            setUnseenMessages((prev) => {
                return prev.filter((message) => !pathname.includes(message.senderId))
            })
        }
    }, [pathname])

    return <ul role='list' className='max-h-[25rem] overflow-y-auto -mx-2 space-y-1'>
        {friends.sort().map((friend) => {
            const usseenMessagesCount = unseenMessages.filter((msg) => {
                return msg.senderId === friend.id
            }).length
            return (
                <li key={friend.id}>
                    <a href={`/dashboard/chat/${chatHrefConstructor(sessionId, friend.id)}`}
                        className='text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'>
                        {friend.name}
                        {usseenMessagesCount > 0 ? (
                            <div className='bg-indigo-600 font-medium text-xs text-white w-4 h-4 rounded-full flex justify-center items-center'>
                                {usseenMessagesCount}
                            </div>
                        ) : null}
                    </a>
                </li>
            )
        })}
    </ul>
}

export default SidebarChatList