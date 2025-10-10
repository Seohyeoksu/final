import MessageForm from '@/components/submit/MessageForm';
import StarBackground from '@/components/common/StarBackground';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1A1B3E] to-[#2D1B4E] flex items-center justify-center relative overflow-hidden">
      <StarBackground />
      <MessageForm />
    </main>
  );
}
