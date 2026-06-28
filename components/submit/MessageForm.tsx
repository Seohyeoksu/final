'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { insertMessage } from '@/lib/supabase';
import { MessageFormData } from '@/types/message';

const formSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(50, '이름은 50자 이내로 입력해주세요'),
  message: z
    .string()
    .min(1, '메시지를 입력해주세요')
    .max(200, '메시지는 200자 이내로 입력해주세요'),
});

export default function MessageForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<MessageFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      message: '',
    },
  });

  const messageValue = watch('message', '');
  const messageLength = messageValue.length;

  const onSubmit = async (data: MessageFormData) => {
    setIsSubmitting(true);
    try {
      await insertMessage(data.name, data.message);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        reset();
      }, 1000);
    } catch (error) {
      console.error('Failed to submit message:', error);
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🏛️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            수업 피드백 앱
          </h1>
          <p className="text-sm text-gray-600">⭐</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              이름
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="이름을 입력하세요"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Message Textarea */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                메시지
              </label>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  messageLength > 200
                    ? 'bg-red-100 text-red-700'
                    : messageLength > 150
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {messageLength}/200
              </span>
            </div>
            <textarea
              id="message"
              {...register('message')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
              placeholder="수업에 대한 피드백을 남겨주세요"
              disabled={isSubmitting}
            />
            {errors.message && (
              <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '전송 중...' : '별 보내기 ✨'}
          </button>
        </form>
      </motion.div>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center max-w-md mx-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="text-8xl mb-4"
              >
                ⭐
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                별이 하늘로 올라갑니다!
              </h2>
              <p className="text-gray-600">
                당신의 별이 하늘에 박혀 빛나길 기다립니다! 🌟
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
