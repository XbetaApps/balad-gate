"use client";
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaUser, FaComments, FaSpinner } from 'react-icons/fa';

export default function HomePostCard({ post, isAuthenticated }) {
  const [isStartingChat, setIsStartingChat] = useState(false);
  
  const startChat = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!isAuthenticated || !post.user_id) return;
    
    setIsStartingChat(true);
    try {
      const response = await fetch('/api/conversations/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: post.user_id,
          message: `مرحباً، أنا مهتم بمنشورك: ${post.title}`,
          postId: post.id
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.conversationId) {
        window.location.href = `/profile?section=chat&conversation=${data.conversationId}`;
      } else {
        throw new Error(data.error || 'فشل في بدء المحادثة');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert(error.message || 'حدث خطأ أثناء محاولة بدء المحادثة');
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <div className="group relative h-64 rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1 bg-white dark:bg-gray-800">
      <Link href={post.link || '#'} className="block h-full">
        <div className="relative h-full w-full">
          <div className="absolute inset-0">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized={!post.image?.startsWith('/')}
              style={{
                filter: 'brightness(0.85)'
              }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute bottom-0 p-5 w-full">
            <span className="inline-block bg-amber-600 text-white text-xs font-medium px-2.5 py-1 rounded-full mb-2">
              {post.category}
            </span>
            <h3 className="text-lg font-bold text-white leading-tight mb-1 group-hover:text-amber-300 transition-colors line-clamp-2">
              {post.title}
            </h3>
            <p className="text-xs text-gray-200">{post.date}</p>
            
            {/* Contact Button */}
            {isAuthenticated && (
              <button
                onClick={startChat}
                disabled={isStartingChat}
                className="absolute top-3 left-3 bg-white/90 hover:bg-white text-amber-600 rounded-full p-2 shadow-md transition-colors flex items-center justify-center"
                title="تواصل مع صاحب المنشور"
              >
                {isStartingChat ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaComments />
                )}
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
