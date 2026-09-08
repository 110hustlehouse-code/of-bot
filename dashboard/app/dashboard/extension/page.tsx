'use client';

const steps = [
  { step: '1', title: 'Download & Extract', desc: 'Download the ZIP from the link above and extract it to a folder on your computer.' },
  { step: '2', title: 'Open Chrome Extensions', desc: 'Go to chrome://extensions in your browser and enable Developer mode (toggle in the top right).' },
  { step: '3', title: 'Load Extension', desc: 'Click Load unpacked and select the extracted extension folder.' },
  { step: '4', title: 'Login', desc: 'Click the Aura icon in your Chrome toolbar, enter your email and password, then click Connect.' },
  { step: '5', title: 'Start', desc: 'Open onlyfans.com/my/chats, click the Aura icon and press Start Aura.' },
];

const features = [
  { icon: '\u{1F50D}', title: 'Monitor', desc: 'Watches for new unread messages on OnlyFans chat.' },
  { icon: '\u{1F916}', title: 'AI Reply', desc: 'Generates replies based on creator persona and sales strategy.' },
  { icon: '\u{2328}', title: 'Human Typing', desc: 'Types character by character with random delays.' },
];

export default function ExtensionPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Chrome Extension</h1>
        <p className="text-gray-400 mt-1">Install and configure the Aura browser extension</p>
      </div>

      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8C577] to-[#8B7439] flex items-center justify-center">
            <span className="text-black text-lg font-bold">A</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Aura Extension v1.0.0</h2>
            <p className="text-sm text-gray-500">Chrome - Manifest V3</p>
          </div>
        </div>
        <a href="https://github.com/110hustlehouse-code/of-bot/releases/latest" target="_blank" rel="noopener noreferrer" className="inline-block bg-gradient-to-b from-[#C9A961] to-[#B08F4A] text-black font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition">Download Extension</a>
      </div>

      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Installation Guide</h2>
        <div className="space-y-4">
          {steps.map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center flex-shrink-0">
                <span className="text-[#C9A961] font-semibold text-sm">{item.step}</span>
              </div>
              <div>
                <h3 className="text-white font-medium">{item.title}</h3>
                <p className="text-gray-400 text-sm mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((item) => (
            <div key={item.title} className="bg-[#141414] rounded-xl p-4">
              <div className="text-2xl mb-2">{item.icon}</div>
              <h3 className="text-white font-medium text-sm">{item.title}</h3>
              <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
