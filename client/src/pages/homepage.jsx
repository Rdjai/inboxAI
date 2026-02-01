// client/src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Smartphone, 
  Mail, 
  Sparkles, 
  Shield, 
  Zap, 
  Download,
  CheckCircle,
  PlayCircle,
  Users,
  Globe,
  Battery,
  Smartphone as Mobile
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "AI-Powered Email Assistant",
      description: "Smart email classification, summarization, and auto-responses powered by advanced AI"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure & Private",
      description: "End-to-end encryption with local AI processing for maximum privacy"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Lightning Fast",
      description: "Optimized Flutter app with native performance and offline capabilities"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Team Collaboration",
      description: "Shared inboxes, team assignments, and collaborative email management"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Multi-Platform",
      description: "Available on Android, iOS, Web, and Desktop with seamless sync"
    },
    {
      icon: <Battery className="h-8 w-8" />,
      title: "Battery Efficient",
      description: "Optimized background sync and push notifications for long battery life"
    }
  ];

  const screenshots = [
    {
      id: 1,
      title: "Smart Inbox",
      description: "AI-organized inbox with priority sorting",
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: 2,
      title: "AI Composer",
      description: "AI-assisted email drafting and suggestions",
      color: "from-purple-500 to-pink-500"
    },
    {
      id: 3,
      title: "Analytics Dashboard",
      description: "Detailed email insights and productivity stats",
      color: "from-green-500 to-emerald-500"
    },
    {
      id: 4,
      title: "Team Collaboration",
      description: "Shared inboxes and team workflows",
      color: "from-orange-500 to-red-500"
    }
  ];

  const techStack = [
    { name: "Flutter", desc: "Cross-platform mobile framework" },
    { name: "Dart", desc: "Programming language for Flutter" },
    { name: "Firebase", desc: "Backend services & authentication" },
    { name: "Node.js", desc: "Email processing backend" },
    { name: "TensorFlow Lite", desc: "On-device AI models" },
    { name: "MongoDB", desc: "Database for email storage" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-5"></div>
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 mb-12 lg:mb-0">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                <Smartphone className="h-4 w-4 mr-2" />
                Now Available on Android
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Transform Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Email Experience
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8">
                The intelligent email assistant that helps you manage, organize, and respond to emails effortlessly. 
                Built with Flutter for seamless Android performance.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#download"
                  className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download App
                </a>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  <PlayCircle className="h-5 w-5 mr-2" />
                  Try Web Version
                </Link>
              </div>
              
              <div className="mt-8 flex items-center space-x-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 border-2 border-white"></div>
                  ))}
                </div>
                <div>
                  <p className="font-medium">Join 10,000+ happy users</p>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-gray-600">4.8/5 (2,500+ reviews)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 relative">
              {/* Mockup Phone */}
              <div className="relative mx-auto w-80">
                <div className="absolute -top-6 -right-6 w-64 h-64 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute -bottom-6 -left-6 w-64 h-64 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full opacity-20 blur-3xl"></div>
                
                <div className="relative bg-gray-900 rounded-[3rem] p-6 shadow-2xl">
                  {/* Phone notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-gray-900 rounded-b-3xl"></div>
                  
                  {/* Screen */}
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-1">
                    <div className="bg-white rounded-[2.5rem] p-6 min-h-[500px] flex flex-col">
                      {/* App header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Mail className="w-5 h-5 text-white" />
                          </div>
                          <span className="ml-2 font-bold text-gray-900">InboxAI</span>
                        </div>
                        <div className="text-sm text-gray-500">2:45 PM</div>
                      </div>
                      
                      {/* Email list */}
                      <div className="space-y-4 flex-1">
                        {[
                          { name: "Alex Johnson", subject: "Meeting Tomorrow", time: "10:30 AM", unread: true },
                          { name: "Sarah Miller", subject: "Project Update", time: "9:15 AM", unread: false },
                          { name: "Team", subject: "Weekly Report", time: "Yesterday", unread: true },
                          { name: "GitHub", subject: "Repository Activity", time: "Yesterday", unread: false }
                        ].map((email, idx) => (
                          <div key={idx} className={`p-3 rounded-xl ${email.unread ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
                            <div className="flex justify-between items-start">
                              <div className="flex items-start">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                  {email.name.charAt(0)}
                                </div>
                                <div className="ml-3">
                                  <p className={`font-medium ${email.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {email.name}
                                  </p>
                                  <p className="text-sm text-gray-600">{email.subject}</p>
                                </div>
                              </div>
                              <span className="text-xs text-gray-500">{email.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Bottom nav */}
                      <div className="flex justify-around items-center pt-4 border-t border-gray-200">
                        {['Inbox', 'Compose', 'AI', 'Teams', 'More'].map((item) => (
                          <button key={item} className="text-gray-600 hover:text-blue-600">
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose InboxAI Mobile?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience email management reimagined for the mobile era with our Flutter-powered Android app
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200 hover:border-blue-200 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              App Screenshots
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how InboxAI looks and feels on your Android device
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {screenshots.map((screenshot) => (
              <div key={screenshot.id} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${screenshot.color} rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="relative bg-gray-900 rounded-[2rem] p-4 shadow-2xl transform group-hover:-translate-y-2 transition-transform duration-300">
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-1">
                    <div className="bg-gradient-to-br from-gray-100 to-white rounded-[1.5rem] p-6 min-h-[400px] flex flex-col">
                      {/* Phone status bar */}
                      <div className="flex justify-between items-center mb-4 text-xs text-gray-600">
                        <span>9:41</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-4 h-1 bg-gray-400 rounded"></div>
                          <div className="w-4 h-1 bg-gray-400 rounded"></div>
                          <div className="w-4 h-1 bg-gray-400 rounded"></div>
                        </div>
                      </div>
                      
                      {/* Screen content */}
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${screenshot.color} flex items-center justify-center`}>
                            <Mail className="w-10 h-10 text-white" />
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg mb-2">{screenshot.title}</h3>
                          <p className="text-sm text-gray-600">{screenshot.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <h3 className="font-bold text-gray-900">{screenshot.title}</h3>
                  <p className="text-gray-600 text-sm">{screenshot.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built with Modern Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powered by Flutter and cutting-edge tools for the best mobile experience
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
            {techStack.map((tech, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 text-center hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Mobile className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{tech.name}</h3>
                <p className="text-sm text-gray-600">{tech.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 md:p-12">
            <div className="flex flex-col lg:flex-row items-center">
              <div className="lg:w-2/3 mb-8 lg:mb-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Why Flutter for Android?
                </h3>
                <ul className="space-y-3">
                  {[
                    "Native performance with 60fps smooth animations",
                    "Single codebase for Android, iOS, Web, and Desktop",
                    "Hot reload for instant development updates",
                    "Beautiful Material Design and Cupertino widgets",
                    "Access to native device features and APIs"
                  ].map((point, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:w-1/3 flex justify-center">
                <div className="relative">
                  <div className="w-48 h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-4xl font-bold">100%</div>
                      <div className="text-lg">Native Performance</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section id="download" className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Email Experience?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Download InboxAI for Android today and experience intelligent email management on the go.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="#"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-all shadow-lg"
            >
              <Download className="h-5 w-5 mr-2" />
              Download for Android
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-all"
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              Watch Demo
            </a>
          </div>
          
          <div className="text-blue-100">
            <p className="mb-2">Android 8.0+ • Free Download • No Ads • Privacy First</p>
            <div className="flex items-center justify-center space-x-6">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                <span>Offline AI</span>
              </div>
              <div className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                <span>Instant Sync</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-white">InboxAI</span>
              </div>
              <p className="mt-2">Intelligent Email Assistant for Android</p>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p>© 2026 InboxAI. Built By Humen with ❤️ using Flutter & Mern. All rights reserved.</p>
            <p className="mt-2 text-sm">The app icon and interface are property of InboxAI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;