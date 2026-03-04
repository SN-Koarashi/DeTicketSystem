import { Calendar, MapPin, Users, Tag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate, formatTime, getRemainingTickets, isEventSoldOut } from '@/lib/utils';
import { categories } from '@/lib/utils';

export default function EventCard({ event }) {
    const data = JSON.parse(event.summary);
    const remaining = getRemainingTickets(event);
    const soldOut = isEventSoldOut(event);
    console.log(data);
    return (
        <Link href={`/events/${event.cid}`}>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all group">
                {/* 活動圖片 */}
                <div className="relative h-48 overflow-hidden">
                    <Image
                        src={data.image && data.image.length > 0 ? data.image : "/placeholder.webp"}
                        alt={data.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-blue-600 px-3 py-1 rounded-full text-sm">
                        {categories[data.category]}
                    </div>
                </div>

                {/* 活動資訊 */}
                <div className="p-4 space-y-3">
                    <h3 className="text-xl font-bold line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {data.name}
                    </h3>

                    <p className="text-gray-400 text-sm line-clamp-2">
                        {data.description}
                    </p>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                            <Calendar size={16} />
                            <span>{formatDate(data.eventAt)} {formatTime(data.eventAt)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-300">
                            <MapPin size={16} />
                            <span className="line-clamp-1">{data.location}</span>
                        </div>
                    </div>

                    {/* 價格與購買按鈕 */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <Tag size={18} className="text-blue-400" />
                            <span className="text-xl font-bold text-blue-400">
                                ${(data.priceCent / 100).toFixed(2)} USD
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
