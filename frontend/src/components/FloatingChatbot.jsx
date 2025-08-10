import React from 'react';
import ChatbotGenerator from '@/components/genai/ChatbotGenerator';

const FloatingChatbot = () => {
  return (
    <>
      

          {/* Chatbot Component */}
          <div className="absolute bottom-20 right-0 w-[300px] sm:w-[350px]">
            <ChatbotGenerator />
          </div>
       

      {/* Responsive Overrides */}
      <style>{`
        @media (max-width: 768px) {
          .floating-chatbot-container {
            bottom: 1rem !important;
            right: 1rem !important;
          }
        }

        @media (max-width: 480px) {
          .floating-chatbot-container {
            bottom: 0.75rem !important;
            right: 0.75rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default FloatingChatbot;
