import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Edit2, Trash2 } from 'lucide-react';
import { Field, Select, SectionTitle } from '../../components/Shared';

export default function BatchChat({ user, data, forms, setForm, api, action, setState, socket }) {
  const batchId = user.role === 'admin' ? forms.filters.batch || data.batches[0]?._id : user.batch?._id;
  const messagesEndRef = useRef(null);
  const [broadcast, setBroadcast] = useState(false);

  // Edit / Delete message states
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    if (!batchId) return;
    socket.connect();
    socket.emit('join-batch', batchId);
    api.get(`/api/messages/${batchId}`)
      .then((messages) => setState((current) => ({ ...current, messages })))
      .catch(() => {});
  }, [batchId]);

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data.messages]);

  async function handleDelete(messageId) {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    await action(async () => {
      const res = await api.delete(`/api/messages/${messageId}`);
      socket.emit('delete-message', { id: messageId, batch: batchId });
      setState((current) => ({
        ...current,
        messages: current.messages.filter((m) => String(m._id) !== String(messageId))
      }));
    }, 'Message deleted successfully');
  }

  async function handleSaveEdit(messageId) {
    if (!editingText.trim()) return;
    await action(async () => {
      const updated = await api.patch(`/api/messages/${messageId}`, { text: editingText });
      socket.emit('edit-message', updated);
      setState((current) => ({
        ...current,
        messages: current.messages.map((m) => String(m._id) === String(messageId) ? updated : m)
      }));
      setEditingMessageId(null);
    }, 'Message updated successfully');
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-bgSecondary border border-borderCool rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-borderCool shrink-0">
        <SectionTitle icon={MessageSquare} title="Batch Chatroom" />
        {user.role === 'admin' && data.batches?.length > 0 && (
          <Select
            value={forms.filters.batch}
            onChange={(value) => setForm('filters', 'batch', value)}
            options={data.batches.map((batch) => [batch._id, batch.name])}
            className="w-[180px]"
          />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-bgPrimary/25">
        {data.messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-xs text-textMuted italic p-8 text-center">
            <MessageSquare size={36} className="text-textMuted/40 mb-2.5" />
            No messages in this chat yet. Start the conversation!
          </div>
        ) : (
          data.messages.map((message, index) => {
            const isMine = message.sender?._id === user._id;
            const isBroadcast = message.kind === 'broadcast';
            const isEditing = editingMessageId === message._id;

            return (
              <div 
                className={`flex flex-col max-w-[85%] sm:max-w-[70%] gap-1 ${
                  isMine ? 'self-end items-end' : 'self-start items-start'
                }`} 
                key={message._id || index}
              >
                {/* Sender Name */}
                <span className="text-[10px] font-bold text-textMuted px-1 flex items-center gap-1.5">
                  {isMine ? 'You' : message.sender?.name || 'User'}
                  {isBroadcast && (
                    <span className="bg-danger/10 text-danger text-[9px] font-bold px-1.5 py-0.5 rounded">Broadcast</span>
                  )}
                </span>
                
                {/* Message Bubble */}
                <div 
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isEditing 
                      ? 'bg-bgSecondary border border-borderCool w-full shadow-md'
                      : isMine 
                      ? 'bg-primary text-white rounded-tr-none shadow-sm' 
                      : 'bg-bgSecondary border border-borderCool text-textPrimary rounded-tl-none shadow-sm'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 min-w-[220px]">
                      <input 
                        type="text" 
                        value={editingText} 
                        onChange={(e) => setEditingText(e.target.value)}
                        className="bg-bgPrimary text-textPrimary text-xs px-2.5 py-1.5 rounded-lg border border-borderCool focus:outline-none focus:border-primary flex-1 min-w-0"
                      />
                      <button 
                        type="button" 
                        onClick={() => handleSaveEdit(message._id)}
                        className="bg-success hover:bg-success/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-md"
                      >
                        Save
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setEditingMessageId(null)}
                        className="bg-bgSecondary border border-borderCool hover:bg-bgHover text-textPrimary text-[10px] font-bold px-2 py-1.5 rounded-md"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    message.text
                  )}
                </div>

                {/* Admin Actions */}
                {user.role === 'admin' && !isEditing && (
                  <div className="flex gap-2 text-[10px] text-textMuted px-1 mt-0.5">
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingMessageId(message._id);
                        setEditingText(message.text);
                      }}
                      className="hover:text-primary transition-colors font-semibold flex items-center gap-0.5"
                    >
                      <Edit2 size={10} /> Edit
                    </button>
                    <span className="opacity-40">|</span>
                    <button 
                      type="button" 
                      onClick={() => handleDelete(message._id)}
                      className="hover:text-danger transition-colors font-semibold flex items-center gap-0.5"
                    >
                      <Trash2 size={10} /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        className="flex flex-col gap-2.5 px-5 py-4 border-t border-borderCool bg-bgSecondary shrink-0"
        onSubmit={(event) => {
          event.preventDefault();
          if (!forms.message.text.trim()) return;
          action(async () => {
            if (user.role === 'admin' && broadcast) {
              const msgs = await api.post('/api/messages/broadcast', { text: forms.message.text });
              msgs.forEach(msg => {
                socket.emit('batch-message', { ...msg, batch: msg.batch });
              });
              const currentMsg = msgs.find(m => String(m.batch) === String(batchId));
              if (currentMsg) {
                setState((current) => ({ ...current, messages: [...current.messages, currentMsg] }));
              }
              setBroadcast(false);
            } else {
              if (!batchId) return;
              const message = await api.post(`/api/messages/${batchId}`, forms.message);
              socket.emit('batch-message', { ...message, batch: batchId });
              setState((current) => ({ ...current, messages: [...current.messages, message] }));
            }
            setForm('message', 'text', '');
          });
        }}
      >
        {user.role === 'admin' && (
          <label className="flex items-center gap-2 cursor-pointer self-start">
            <input 
              type="checkbox" 
              checked={broadcast} 
              onChange={(e) => setBroadcast(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-borderCool"
            />
            <span className="text-xs font-semibold text-textSecondary select-none">Broadcast to all batches</span>
          </label>
        )}
        <div className="flex items-end gap-3 w-full">
          <div className="flex-1 min-w-0">
            <Field 
              placeholder={broadcast ? "Type broadcast message to all cohorts..." : "Type a message..."}
              value={forms.message.text} 
              onChange={(value) => setForm('message', 'text', value)} 
              required 
              autoComplete="off"
            />
          </div>
          <button className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/95 text-white px-4 py-3 rounded-lg shadow-sm shrink-0 mb-[1px]">
            <Send size={14} /> Send
          </button>
        </div>
      </form>
    </div>
  );
}
