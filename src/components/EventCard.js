import { Calendar, MapPin, Users, Tag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate, getRemainingTickets, isEventSoldOut } from '@/lib/utils';

export default function EventCard({ event }) {
    const remaining = getRemainingTickets(event);
    const soldOut = isEventSoldOut(event);

    return (
        <Link href={`/events/${event.id}`}>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all group">
                {/* 活動圖片 */}
                <div className="relative h-48 overflow-hidden">
                    <Image
                        src={event.image}
                        alt={event.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {soldOut && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <span className="text-2xl font-bold text-red-500">已售完</span>
                        </div>
                    )}
                    <div className="absolute top-4 right-4 bg-blue-600 px-3 py-1 rounded-full text-sm">
                        {event.category}
                    </div>
                </div>

                {/* 活動資訊 */}
                <div className="p-4 space-y-3">
                    <h3 className="text-xl font-bold line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {event.name}
                    </h3>

                    <p className="text-gray-400 text-sm line-clamp-2">
                        {event.description}
                    </p>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                            <Calendar size={16} />
                            <span>{formatDate(event.date)} {event.time}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-300">
                            <MapPin size={16} />
                            <span className="line-clamp-1">{event.location}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-300">
                            <Users size={16} />
                            <span>剩餘 {remaining} / {event.totalTickets} 張</span>
                        </div>
                    </div>

                    {/* 價格與購買按鈕 */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <Tag size={18} className="text-blue-400" />
                            <span className="text-xl font-bold text-blue-400">
                                {event.ticketPrice} {event.currency}
                            </span>
                        </div>

                        <button
                            disabled={soldOut}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${soldOut
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                        >
                            {soldOut ? '已售完' : '購票'}
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
