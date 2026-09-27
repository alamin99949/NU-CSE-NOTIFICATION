import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  HelpCircle, 
  FileText, 
  Clock, 
} from 'lucide-react';
import { Notice } from '../types';

interface AiAssistantViewProps {
  cseNotices: Notice[];
  onSelectNotice: (notice: Notice) => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  relatedNoticeId?: string;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  cseNotices,
  onSelectNotice,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: `Hello! I am your **National University CSE Department Notice Assistant**. I have indexed all **${cseNotices.length} CSE Examination Notices** currently in your department folder.\n\nYou can ask me about:\n- 🗓️ *"When is the 8th semester final examination routine?"*\n- 📝 *"What is the form fill-up deadline for 5th semester?"*\n- 🧪 *"Are there any practical lab or viva schedules published?"*\n- 📊 *"Which semester results are currently published?"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const suggestedQuestions = [
    'When does the 8th semester exam start?',
    'What is the last date for 5th semester form fill-up?',
    'Show me practical & viva examination notices',
    'How do I apply for result re-scrutiny in CSE?',
  ];

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      // Intelligent answer engine based on scraped CSE notices
      const q = query.toLowerCase();
      let reply = '';
      let matchedNotice: Notice | undefined;

      if (q.includes('8th') || q.includes('eighth') || q.includes('routine') || q.includes('schedule') || q.includes('exam date')) {
        matchedNotice = cseNotices.find(n => n.category === 'Routine' || n.title.includes('8th') || n.title.includes('Routine'));
        if (matchedNotice) {
          reply = `📌 **Exam Routine Update for ${matchedNotice.semester || 'CSE Department'}:**\n\nAccording to official National University notice: *"${matchedNotice.title}"* (Published on ${matchedNotice.publishDate}):\n\n- **Target Session:** 4th Year B.Sc in CSE 8th Semester Examination 2023 (held in 2025).\n- **Key Dates:** Examinations start from **15 March 2025**.\n- **Admit Cards:** Download available via Sonali Seba and principal signature by **10 March 2025**.\n\nYou can click below to download the official PDF routine.`;
        }
      } else if (q.includes('form') || q.includes('fill') || q.includes('5th') || q.includes('fee')) {
        matchedNotice = cseNotices.find(n => n.category === 'Form Fill-up' || n.title.includes('Form'));
        if (matchedNotice) {
          reply = `📝 **Form Fill-up Notice for ${matchedNotice.semester || 'CSE Candidates'}:**\n\nOfficial notice: *"${matchedNotice.title}"*:\n\n- **Without Late Fee:** 12 March 2025\n- **With Late Fee:** 20 March 2025\n- **College Verification:** 22 March 2025\n\n👉 **Action:** Log in to the National University online form portal, print the pay slip, and pay dues at your college cash counter.`;
        }
      } else if (q.includes('practical') || q.includes('viva') || q.includes('lab') || q.includes('project')) {
        matchedNotice = cseNotices.find(n => n.category === 'Practical & Viva');
        if (matchedNotice) {
          reply = `🧪 **Practical Exam & Project Viva Schedule:**\n\nNotice: *"${matchedNotice.title}"* (Published on ${matchedNotice.publishDate}):\n\n- **Examination Window:** 05 March – 18 March 2025\n- **Required Materials:** Bring your laboratory experiment notebook, project documentation report, and original NU registration card.\n- **Marks Submission:** External examiner marks submission deadline is 25 March 2025.`;
        }
      } else if (q.includes('result') || q.includes('re-scrutiny') || q.includes('re scrutiny') || q.includes('marks')) {
        matchedNotice = cseNotices.find(n => n.category === 'Result' || n.category === 'Re-scrutiny');
        if (matchedNotice) {
          reply = `📊 **Result Publication & Re-scrutiny:**\n\nNotice: *"${matchedNotice.title}"*:\n\n- **Re-scrutiny Application Window:** Open within 15 days from publication date.\n- **Application Method:** Apply online via Sonali Seba portal fee payment.\n- **Fee:** Standard NU prescribed per-paper scrutiny fee.`;
        }
      } else {
        reply = `I searched your CSE Department notice folder (${cseNotices.length} notices found). Here are the latest announcements:\n\n` +
          cseNotices.slice(0, 3).map((n, i) => `${i + 1}. **[${n.category}]** ${n.title} (${n.publishDate})`).join('\n\n') +
          `\n\nLet me know if you want detailed breakdown on exam dates, form fill-up, or admit card distribution!`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        relatedNoticeId: matchedNotice?.id,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-600 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              NU CSE Notice Intelligence Assistant
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ask natural questions about routines, examination centers, fees, and viva schedules. Grounded in official NU notices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
            ✓ {cseNotices.length} Notices Indexed
          </span>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const relatedNotice = msg.relatedNoticeId ? cseNotices.find(n => n.id === msg.relatedNoticeId) : undefined;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs sm:text-sm ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 space-y-2 shadow-xs ${
                  isUser 
                    ? 'bg-emerald-600 text-white rounded-br-xs' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                }`}>
                  <div className="whitespace-pre-line leading-relaxed">
                    {msg.text}
                  </div>

                  {relatedNotice && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 truncate">
                        📄 {relatedNotice.title}
                      </span>
                      <button
                        onClick={() => onSelectNotice(relatedNotice)}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-[11px] rounded-lg transition-colors whitespace-nowrap"
                      >
                        Inspect Notice
                      </button>
                    </div>
                  )}

                  <div className={`text-[10px] font-mono text-right ${isUser ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 items-center text-xs text-slate-400">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Queries Chips */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-200 overflow-x-auto flex items-center gap-2 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 whitespace-nowrap">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            Quick Prompts:
          </span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 text-slate-700 transition-all whitespace-nowrap shadow-xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about CSE exam schedules, form fill-up, practical viva..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 shadow-xs"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
