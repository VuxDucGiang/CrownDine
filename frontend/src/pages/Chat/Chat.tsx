import { useState, useEffect, useRef } from 'react'
import { Send, Plus, Trash2, MessageSquare } from 'lucide-react'
import chatApi from '@/apis/chat.api'
import type { ChatConversation, ChatMessage, ChatMessageRequest } from '@/types/chat.type'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function Chat() {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Poll for new messages when conversation is active
  useEffect(() => {
    if (currentConversation) {
      const interval = setInterval(() => {
        loadConversation(currentConversation.id)
      }, 2000) // Poll every 2 seconds
      setPollingInterval(interval)
      return () => {
        clearInterval(interval)
      }
    } else {
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
    }
  }, [currentConversation])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    try {
      const response = await chatApi.listConversations()
      if (response.data.data) {
        setConversations(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const loadConversation = async (conversationId: number) => {
    try {
      const response = await chatApi.getConversation(conversationId)
      if (response.data.data) {
        setCurrentConversation(response.data.data)
        // Update in conversations list too
        setConversations((prev) => prev.map((conv) => (conv.id === conversationId ? response.data.data! : conv)))
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  const createConversation = async () => {
    setIsCreatingConversation(true)
    try {
      const response = await chatApi.createConversation({})
      if (response.data.data) {
        const newConv = response.data.data
        setConversations([newConv, ...conversations])
        setCurrentConversation(newConv)
        toast.success('Tạo cuộc trò chuyện mới thành công')
      }
    } catch (error) {
      toast.error('Không thể tạo cuộc trò chuyện mới')
      console.error('Failed to create conversation:', error)
    } finally {
      setIsCreatingConversation(false)
    }
  }

  const sendMessage = async () => {
    if (!message.trim() || !currentConversation || isLoading) return

    const messageToSend = message.trim()
    setMessage('')
    setIsLoading(true)

    try {
      const request: ChatMessageRequest = {
        conversationId: currentConversation.id,
        content: messageToSend
      }

      const response = await chatApi.sendMessage(request)
      if (response.data.data) {
        // Add user message immediately
        const userMessage: ChatMessage = {
          id: response.data.data.id,
          role: 'user',
          content: messageToSend,
          createdAt: new Date().toISOString()
        }

        setCurrentConversation((prev) => {
          if (!prev) return null
          return {
            ...prev,
            messages: [...prev.messages, userMessage]
          }
        })

        // Poll for assistant response
        setTimeout(() => {
          loadConversation(currentConversation.id)
        }, 1000)
      }
    } catch (error) {
      toast.error('Không thể gửi tin nhắn')
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteConversation = async (conversationId: number) => {
    try {
      await chatApi.deleteConversation(conversationId)
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
      }
      toast.success('Xóa cuộc trò chuyện thành công')
    } catch (error) {
      toast.error('Không thể xóa cuộc trò chuyện')
      console.error('Failed to delete conversation:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className='flex h-[calc(100vh-80px)] bg-gray-50'>
      {/* Sidebar - Conversations List */}
      <div className='flex w-80 flex-col border-r border-gray-200 bg-white'>
        <div className='border-b border-gray-200 p-4'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-xl font-bold text-gray-800'>Trò chuyện</h2>
            <Button
              onClick={createConversation}
              disabled={isCreatingConversation}
              size='sm'
              className='bg-blue-600 hover:bg-blue-700'
            >
              <Plus className='mr-1 h-4 w-4' />
              Mới
            </Button>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto'>
          {conversations.length === 0 ? (
            <div className='p-4 text-center text-gray-500'>
              <MessageSquare className='mx-auto mb-2 h-12 w-12 text-gray-300' />
              <p>Chưa có cuộc trò chuyện nào</p>
              <p className='mt-1 text-sm'>Tạo cuộc trò chuyện mới để bắt đầu</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`cursor-pointer border-b border-gray-100 p-4 transition-colors hover:bg-gray-50 ${
                  currentConversation?.id === conv.id ? 'border-l-4 border-l-blue-600 bg-blue-50' : ''
                }`}
              >
                <div className='flex items-start justify-between'>
                  <div className='min-w-0 flex-1'>
                    <h3 className='truncate font-semibold text-gray-800'>{conv.title}</h3>
                    <p className='mt-1 text-sm text-gray-500'>
                      {conv.messages.length > 0
                        ? conv.messages[conv.messages.length - 1].content.substring(0, 50) + '...'
                        : 'Chưa có tin nhắn'}
                    </p>
                    <p className='mt-1 text-xs text-gray-400'>{new Date(conv.updatedAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(conv.id)
                    }}
                    className='ml-2 p-1 text-gray-400 transition-colors hover:text-red-600'
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className='flex flex-1 flex-col'>
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className='border-b border-gray-200 bg-white p-4'>
              <h3 className='text-lg font-semibold text-gray-800'>{currentConversation.title}</h3>
            </div>

            {/* Messages */}
            <div className='flex-1 space-y-4 overflow-y-auto p-4'>
              {currentConversation.messages
                .filter((msg) => msg.role !== 'system')
                .map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.role === 'user' ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-800'
                      }`}
                    >
                      <p className='break-words whitespace-pre-wrap'>{msg.content}</p>
                      <p className={`mt-1 text-xs ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              {isLoading && (
                <div className='flex justify-start'>
                  <div className='rounded-lg border border-gray-200 bg-white p-3'>
                    <div className='flex space-x-1'>
                      <div className='h-2 w-2 animate-bounce rounded-full bg-gray-400' />
                      <div
                        className='h-2 w-2 animate-bounce rounded-full bg-gray-400'
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className='h-2 w-2 animate-bounce rounded-full bg-gray-400'
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className='border-t border-gray-200 bg-white p-4'>
              <div className='flex items-end space-x-2'>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder='Nhập tin nhắn của bạn...'
                  className='max-h-[120px] min-h-[60px] flex-1 resize-none rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none'
                  rows={2}
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!message.trim() || isLoading}
                  className='h-[60px] bg-blue-600 px-6 hover:bg-blue-700'
                >
                  <Send className='h-5 w-5' />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className='flex flex-1 items-center justify-center'>
            <div className='text-center text-gray-500'>
              <MessageSquare className='mx-auto mb-4 h-24 w-24 text-gray-300' />
              <h3 className='mb-2 text-xl font-semibold'>Chào mừng đến với CrownDine Chat!</h3>
              <p className='mb-4'>Chọn một cuộc trò chuyện hoặc tạo mới để bắt đầu</p>
              <Button onClick={createConversation} className='bg-blue-600 hover:bg-blue-700'>
                <Plus className='mr-2 h-4 w-4' />
                Tạo cuộc trò chuyện mới
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
