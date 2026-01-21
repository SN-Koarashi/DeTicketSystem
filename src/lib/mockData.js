// Mock 資料 - Phase 1 用於前端開發，不接合約與 IPFS

export const mockEvents = [
    {
        id: '1',
        name: '區塊鏈技術研討會 2026',
        description: '探討最新的區塊鏈技術趨勢與應用，包括 DeFi、NFT 和智能合約開發',
        date: '2026-03-15',
        time: '14:00',
        location: '台北國際會議中心',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        ticketPrice: '0.05',
        currency: 'ETH',
        totalTickets: 200,
        soldTickets: 145,
        organizer: '台灣區塊鏈協會',
        category: '科技'
    },
    {
        id: '2',
        name: '音樂祭 - 夏日狂歡夜',
        description: '集結國內外知名樂團的夏日音樂盛宴，一起搖滾整晚',
        date: '2026-07-20',
        time: '18:00',
        location: '台中市圓滿戶外劇場',
        image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
        ticketPrice: '0.08',
        currency: 'ETH',
        totalTickets: 500,
        soldTickets: 320,
        organizer: '夏日音樂製作',
        category: '音樂'
    },
    {
        id: '3',
        name: 'Web3 開發者工作坊',
        description: '手把手教你開發去中心化應用，從智能合約到前端整合',
        date: '2026-04-10',
        time: '10:00',
        location: '線上活動',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
        ticketPrice: '0.03',
        currency: 'ETH',
        totalTickets: 100,
        soldTickets: 78,
        organizer: 'Web3 教育基金會',
        category: '教育'
    },
    {
        id: '4',
        name: 'NFT 藝術展覽',
        description: '展示來自世界各地的 NFT 藝術作品，探索數位藝術的未來',
        date: '2026-05-01',
        time: '11:00',
        location: '台北當代藝術館',
        image: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800',
        ticketPrice: '0.02',
        currency: 'ETH',
        totalTickets: 300,
        soldTickets: 250,
        organizer: 'Digital Art Collective',
        category: '藝術'
    },
    {
        id: '5',
        name: '創業家交流晚宴',
        description: '匯集科技創業家的交流盛會，分享創業經驗與尋找合作機會',
        date: '2026-06-15',
        time: '19:00',
        location: '台北君悅酒店',
        image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
        ticketPrice: '0.1',
        currency: 'ETH',
        totalTickets: 150,
        soldTickets: 120,
        organizer: '創業台灣',
        category: '商業'
    }
];

// Mock 購票記錄
export const mockPurchases = [];

// Mock 簽到記錄
export const mockCheckIns = [];

// Mock 用戶資料
export const mockUser = {
    address: null,
    connected: false
};
