import { useState } from "react";
import { MessageCircle, Send, CheckCircle2 } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "customer" | "seller";
  text: string;
  time: string;
}

export default function ShopeeChat() {
  const [chatConversations, setChatConversations] = useState([
    {
      id: "c1",
      customer: "nguyenthimai_92",
      avatar: "M",
      lastMsg: "Dạ shop tư vấn giúp em size L nặng 56kg mặc vừa không ạ?",
      time: "10:24",
      unread: true,
      orderCode: "241023SPX9821",
      messages: [
        { id: "m1", sender: "customer", text: "Chào shop ạ! Mẫu đầm lụa công sở màu be em cao 1m58 nặng 56kg thì nên lấy size L hay XL ạ?", time: "10:20" },
        { id: "m2", sender: "seller", text: "Dạ em chào chị Mai ạ! Mẫu này form may chuẩn eo co giãn nhẹ, số đo 56kg chị mặc size L sẽ rất tôn dáng và vừa vặn thoải mái chị nhé!", time: "10:22" },
        { id: "m3", sender: "customer", text: "Dạ shop tư vấn giúp em size L nặng 56kg mặc vừa không ạ? Nếu em đặt trưa nay thì SPX mai có giao tới Cầu Giấy Hà Nội không?", time: "10:24" }
      ] as ChatMessage[]
    },
    {
      id: "c2",
      customer: "tranhuy_danang",
      avatar: "H",
      lastMsg: "Đơn này shop giao cho bên SPX chưa nhỉ?",
      time: "09:15",
      unread: false,
      orderCode: "241022SPX3341",
      messages: [
        { id: "m1", sender: "customer", text: "Đơn này shop giao cho bên SPX chưa nhỉ?", time: "09:15" },
        { id: "m2", sender: "seller", text: "Dạ đơn của anh Huy bên em đã đóng gói xong và bàn giao cho bưu tá SPX ca sáng nay rồi ạ. Anh theo dõi lộ trình trên app Shopee nhé!", time: "09:18" }
      ] as ChatMessage[]
    }
  ]);
  const [activeChatId, setActiveChatId] = useState("c1");
  const [chatReply, setChatReply] = useState("");

  function handleSendChat() {
    if (!chatReply.trim()) return;
    const currentConv = chatConversations.find(c => c.id === activeChatId);
    if (!currentConv) return;

    const newMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      sender: "seller",
      text: chatReply,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };

    setChatConversations(chatConversations.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastMsg: chatReply,
          time: newMsg.time,
          unread: false,
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));
    setChatReply("");
  }

  const currentChat = chatConversations.find(c => c.id === activeChatId);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <MessageCircle className="text-[#EE4D2D]" />
            Shopee Web Chat Khách Hàng
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Tư vấn sản phẩm thời trang, chốt đơn size số và hỗ trợ đơn hàng trực tiếp với khách mua Shopee.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
            Tỷ lệ phản hồi: 98.6% (Chuẩn Shopee Mall)
          </span>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-3 h-[580px]">
        {/* Hội Thoại */}
        <div className="border-r border-gray-800 flex flex-col h-full bg-gray-900/60">
          <div className="p-3.5 border-b border-gray-800 flex items-center justify-between">
            <span className="font-bold text-white text-xs">Hộp Thư Khách Hàng</span>
            <span className="text-[10px] bg-orange-500/20 text-[#EE4D2D] font-bold px-2 py-0.5 rounded-full">Trực tuyến</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
            {chatConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setActiveChatId(conv.id)}
                className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                  activeChatId === conv.id ? "bg-orange-500/10 border-l-2 border-[#EE4D2D]" : "hover:bg-gray-800/40"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white text-xs">
                  {conv.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-white text-xs truncate">@{conv.customer}</span>
                    <span className="text-[10px] text-gray-500">{conv.time}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{conv.lastMsg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cửa Sổ Chat */}
        <div className="col-span-2 flex flex-col h-full bg-gray-950">
          {currentChat && (
            <>
              <div className="p-3.5 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">@{currentChat.customer}</span>
                  <span className="text-[11px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    Đơn #{currentChat.orderCode}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Đang hoạt động
                </span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {currentChat.messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === "seller" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-md rounded-2xl px-3.5 py-2 text-xs ${
                      m.sender === "seller"
                        ? "bg-[#EE4D2D] text-white rounded-br-sm"
                        : "bg-gray-800 text-gray-200 rounded-bl-sm border border-gray-700"
                    }`}>
                      <p>{m.text}</p>
                      <span className={`text-[9px] block text-right mt-1 ${m.sender === "seller" ? "text-orange-200" : "text-gray-500"}`}>
                        {m.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-gray-800 bg-gray-900 flex items-center gap-2">
                <input
                  type="text"
                  value={chatReply}
                  onChange={(e) => setChatReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="Nhập nội dung tư vấn size, kiểm tra đơn hàng Shopee..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={handleSendChat}
                  className="p-2 rounded-xl bg-[#EE4D2D] hover:bg-orange-600 text-white transition-colors"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
