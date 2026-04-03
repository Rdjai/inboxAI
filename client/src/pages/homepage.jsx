// client/src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
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
  Smartphone as Mobile,
  Menu,
  X,
  ArrowRight,
  ExternalLink,
  Rocket,
  Clock,
  Wrench,
  Code,
  Eye,
  RefreshCw,
  Brain,
  BarChart,
  Send,
  Inbox,
  Filter,
  Github
} from 'lucide-react';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI Email Assistant",
      description: "Smart email classification, summarization, and auto-responses powered by advanced AI",
      highlight: true
    },
    {
      icon: <BarChart className="h-8 w-8" />,
      title: "Smart Analytics",
      description: "Detailed insights into your email habits and productivity patterns",
      highlight: true
    },
    {
      icon: <RefreshCw className="h-8 w-8" />,
      title: "Temp Email Generator",
      description: "Create disposable email addresses for signups and spam protection",
      highlight: true
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
    },
    {
      icon: <Filter className="h-8 w-8" />,
      title: "Smart Filtering",
      description: "AI-powered spam detection and email organization"
    }
  ];

  const mainFeatures = [
    {
      icon: "🤖",
      title: "AI-Powered Email Management",
      description: "Let AI organize, prioritize, and respond to your emails automatically",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: "📧",
      title: "Temporary Email Service",
      description: "Generate disposable emails for signups, verifications, and spam protection",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: "📊",
      title: "Productivity Analytics",
      description: "Get insights into your email habits and improve your workflow",
      color: "from-green-500 to-emerald-500"
    }
  ];

  const screenshots = [
    {
      id: 1,
      url:"https://ik.imagekit.io/jjgsg6qhe/3-portrait.png",
      title: "AI Smart Inbox",
      description: "AI-organized inbox with priority sorting",
      icon: <Brain className="w-8 h-8" />,
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: 2,
      url:"https://ik.imagekit.io/jjgsg6qhe/5-portrait.png",
      title: "Temp Mail Generator",
      description: "Create disposable emails instantly",
      icon: <RefreshCw className="w-8 h-8" />,
      color: "from-purple-500 to-pink-500"
    },
    {
      id: 3,
      url:"https://ik.imagekit.io/jjgsg6qhe/4-portrait.png",
      title: "inbox Dashboard",
      description: "Detailed email insights and productivity stats",
      icon: <BarChart className="w-8 h-8" />,
      color: "from-green-500 to-emerald-500"
    },
    {
      id: 4,
      url:"https://ik.imagekit.io/jjgsg6qhe/2-portrait.png",
      title: "Team Collaboration",
      description: "Shared inboxes and team workflows",
      icon: <Users className="w-8 h-8" />,
      color: "from-orange-500 to-red-500"
    }
  ];

  const techStack = [
    { name: "Flutter", desc: "Cross-platform mobile framework" },
    { name: "Dart", desc: "Programming language for Flutter" },
    { name: "Express", desc: "Backend services & authentication" },
    { name: "Node.js", desc: "Email processing backend" },
    { name: "TensorFlow Lite", desc: "On-device AI models" },
    { name: "MongoDB", desc: "Database for email storage" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Development Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2 px-4 text-center font-bold text-sm md:text-base">
        <div className="container mx-auto flex items-center justify-center space-x-2">
          <Wrench className="h-4 w-4 md:h-5 md:w-5" />
          <span>🚧 UNDER ACTIVE DEVELOPMENT - Join our waitlist for early access!</span>
          <a href="#waitlist" className="ml-2 inline-flex items-center text-sm bg-white text-amber-600 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors">
            Join Waitlist <ArrowRight className="h-3 w-3 ml-1" />
          </a>
        </div>
      </div>

      {/* Navbar */}
      <nav className={`fixed top-8 left-0 right-0 z-40 transition-all duration-300 ${scrollY > 50 ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">InboxAI</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-amber-600 font-medium">Coming Soon</span>
                </div>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="https://rdjkashyap.cv/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Connect With Me</a>
              <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Features</a>
              <a href="#screenshots" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Screenshots</a>
              <a href="#ai" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">AI Assistant</a>
              <a href="#temp-email" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Temp Mail</a>
              <a href="#waitlist" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Waitlist</a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-2xl p-6 mt-2 border border-gray-200">
              <div className="flex flex-col space-y-4">
                <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 font-medium py-2">Features</a>
                <a href="#screenshots" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 font-medium py-2">Screenshots</a>
                <a href="#ai" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 font-medium py-2">AI Assistant</a>
                <a href="#temp-email" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 font-medium py-2">Temp Mail</a>
                <a href="#waitlist" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 font-medium py-2">Waitlist</a>
                
                <div className="pt-4 border-t border-gray-200">
                  <a href="#waitlist" onClick={() => setIsMenuOpen(false)} className="block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all text-center font-medium">
                    Join Waitlist
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 md:pt-28">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-5 pointer-events-none"></div>
        <div className="container mx-auto px-4 py-12 md:py-24">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 mb-12 lg:mb-0">
              {/* Coming Soon Badge */}
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-full text-sm font-medium mb-6">
                <Clock className="h-4 w-4 mr-2" />
                🚀 COMING SOON - Be the first to experience it!
              </div>
              
              <div className="flex items-center space-x-2 mb-4">
                <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  <Brain className="h-4 w-4 mr-2" />
                  AI-Powered Email Assistant
                </div>
                <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  + Temp Mail Service
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Intelligent Email
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Meets Privacy
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8">
                Transform your email experience with AI-powered intelligence and disposable privacy protection. 
                Smart email management meets secure temporary emails in one powerful app.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#waitlist"
                  className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-center cursor-pointer"
                >
                  <Rocket className="h-5 w-5 mr-2" />
                  Join Waitlist for Early Access
                </a>

                <a
                  href="https://github.com/Rdjai/inboxAI"
                  target='_blank'
                  className="inline-flex items-center justify-center px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-center cursor-pointer"
                >
                  <Github className="h-5 w-5 mr-2 cursor-pointer" />
                  Contribute github
                </a>
              </div>
                            
              <div className="mt-8 flex items-center space-x-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 border-2 border-white"></div>
                  ))}
                </div>
                <div>
                  <p className="font-medium text-gray-900"><span className="text-blue-600">1,200+</span> people on waitlist</p>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-gray-600">Coming soon</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 relative">
              {/* Coming Soon Badge on Mockup */}
              <div className="absolute -top-4 right-4 z-10">
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  🔧 PREVIEW
                </div>
              </div>
              
              {/* Mockup Phone */}
              <div className="relative mx-auto w-80 opacity-90">
                <div className="absolute -top-6 -right-6 w-64 h-64 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-10 blur-3xl"></div>
                <div className="absolute -bottom-6 -left-6 w-64 h-64 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full opacity-10 blur-3xl"></div>
              <img src='https://ik.imagekit.io/jjgsg6qhe/3-portrait.png'/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Highlight */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4 mr-2" />
              ONE APP, MULTIPLE SOLUTIONS
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Complete Email Experience
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AI-powered intelligence meets privacy protection in a single, powerful application
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {mainFeatures.map((feature, index) => (
              <div key={index} className={`bg-gradient-to-br ${feature.color} p-8 rounded-2xl text-white transform hover:-translate-y-2 transition-transform duration-300`}>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="opacity-90">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots Section - Added Here */}
      <section id="screenshots" className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium mb-4">
              <Eye className="h-4 w-4 mr-2" />
              APP SCREENSHOTS
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              See InboxAI in Action
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Preview of the beautiful and intuitive interface we're building
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {screenshots.map((screenshot) => (
              <div key={screenshot.id} className="group relative">
                
                <img src={screenshot.url}/>
                <div className="mt-3 md:mt-4 text-center">
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">{screenshot.title}</h3>
                  <p className="text-gray-600 text-xs md:text-sm">{screenshot.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section id="ai" className="py-16 md:py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-full text-sm font-medium mb-4">
              <Brain className="h-4 w-4 mr-2" />
              AI-POWERED INTELLIGENCE
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Smart Email Assistant
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Let artificial intelligence handle the heavy lifting of email management
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                Your AI Email Co-pilot
              </h3>
              
              <div className="space-y-4">
                {[
                  "Smart email categorization and priority sorting",
                  "AI-generated email summaries and responses",
                  "Automated follow-up reminders and scheduling",
                  "Spam detection with 99.9% accuracy",
                  "Sentiment analysis for important conversations",
                  "Smart templates based on your writing style"
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <a href="#waitlist" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all">
                  <Brain className="h-5 w-5 mr-2" />
                  Get Early Access to AI Features
                </a>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Brain className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h4 className="font-bold text-gray-900">AI Assistant Active</h4>
                    <p className="text-sm text-gray-600">Processing your emails</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">Email Analysis</span>
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">Priority Sorting</span>
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Active</span>
                    </div>
                    <p className="text-sm text-gray-600">12 emails organized by priority</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">Auto-Responses</span>
                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">3 ready</span>
                    </div>
                    <p className="text-sm text-gray-600">AI-generated replies prepared</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Temp Email Section */}
      <section id="temp-email" className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full text-sm font-medium mb-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              BONUS FEATURE
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Temporary Email Service
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Protect your privacy with disposable emails - included with every account
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 mb-4 text-lg">Generate Temp Email</h4>
                  
                  <div className="mb-6">
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-purple-200">
                      <code className="font-mono text-purple-600">random7482@temp.inboxai.com</code>
                      <div className="flex space-x-2">
                        <button className="text-purple-600 hover:text-purple-700">
                          📋
                        </button>
                        <button className="text-green-600 hover:text-green-700">
                          🔄
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Expires in 24 hours • Unlimited generations</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button className="bg-purple-100 text-purple-600 py-2 rounded-lg text-sm hover:bg-purple-200">
                      Copy Email
                    </button>
                    <button className="bg-pink-100 text-pink-600 py-2 rounded-lg text-sm hover:bg-pink-200">
                      View Inbox
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                Privacy Protection Included
              </h3>
              
              <div className="space-y-4">
                {[
                  "Generate unlimited disposable email addresses",
                  "Receive emails without revealing your real address",
                  "Perfect for signups, verifications, and testing",
                  "Auto-expiring emails for enhanced security",
                  "Integrated with your main AI inbox",
                  "No additional cost - included with your account"
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <p className="text-gray-600 mb-4">
                  <span className="font-bold text-purple-600">Bonus:</span> Every InboxAI account comes with 
                  free temporary email service at no extra cost.
                </p>
                <a href="#waitlist" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all">
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Get Temp Mail + AI Assistant
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Features Section */}
      <section id="features" className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4 mr-2" />
              COMPLETE FEATURE SET
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A comprehensive email solution packed with powerful features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div key={index} className={`bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border ${feature.highlight ? 'border-blue-200 shadow-lg' : 'border-gray-200'} hover:border-blue-300 hover:shadow-xl transition-all duration-300`}>
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-white mb-4 md:mb-6 ${feature.highlight ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gradient-to-r from-gray-400 to-gray-600'}`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm md:text-base">{feature.description}</p>
                {feature.highlight && (
                  <div className="mt-4 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
                    ⭐ Featured
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section id="waitlist" className="py-16 md:py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center px-4 py-2 md:px-6 md:py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs md:text-sm font-medium mb-4 md:mb-6">
            <Rocket className="h-3 w-3 md:h-4 md:w-4 mr-2 animate-pulse" />
            🚀 LIMITED EARLY ACCESS AVAILABLE
          </div>
          
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6">
            Join the Email Revolution
          </h2>
          <p className="text-lg md:text-xl text-blue-100 mb-6 md:mb-8 max-w-2xl mx-auto">
            Be among the first to experience AI-powered email management with built-in privacy protection.
            First 500 signups get lifetime premium features!
          </p>
          
          {/* Waitlist Form */}
          <div className="max-w-md mx-auto mb-8 md:mb-12">
            <form className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email for early access"
                className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg font-medium"
              >
                Join Waitlist
              </button>
            </form>
            <p className="text-blue-100 text-sm mt-3">
              We'll only email you about important updates. No spam, ever.
            </p>
          </div>
          
          <div className="text-blue-100 text-sm md:text-base">
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
              <div className="flex items-center">
                <Brain className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                <span>AI Email Assistant</span>
              </div>
              <div className="flex items-center">
                <RefreshCw className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                <span>Temporary Emails</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                <span>Privacy Protection</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-10 text-gray-400 md:py-14">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-md">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <span className="text-xl font-bold text-white">InboxAI</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-amber-400">AI + Temp Mail</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 md:text-base">Intelligent Email with Privacy Protection</p>
            </div>
            
            <div className="flex max-w-2xl flex-wrap justify-start gap-x-3 gap-y-3 text-sm md:justify-end md:gap-x-4 md:gap-y-4 md:text-base">
              <a href="#screenshots" className="rounded-full border border-gray-800 px-4 py-2 transition-all hover:border-gray-600 hover:bg-white/5 hover:text-white">Screenshots</a>
              <a href="#ai" className="rounded-full border border-gray-800 px-4 py-2 transition-all hover:border-gray-600 hover:bg-white/5 hover:text-white">AI Assistant</a>
              <a href="#temp-email" className="rounded-full border border-gray-800 px-4 py-2 transition-all hover:border-gray-600 hover:bg-white/5 hover:text-white">Temp Mail</a>
              <a href="#features" className="rounded-full border border-gray-800 px-4 py-2 transition-all hover:border-gray-600 hover:bg-white/5 hover:text-white">Features</a>
              <a href="#waitlist" className="rounded-full border border-gray-800 px-4 py-2 transition-all hover:border-gray-600 hover:bg-white/5 hover:text-white">Waitlist</a>
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-800 pt-8 text-center md:mt-10 md:pt-10">
            <p className="text-sm md:text-base">© 2026 InboxAI. Built By Alien with ❤️ using Flutter & Mern.</p>
            <p className="mt-3 text-xs leading-6 md:text-sm">AI email assistant with temporary email service. Currently in development.</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs md:gap-x-4 md:text-sm">
              <span className="text-amber-400">🚧 Status: In Development</span>
              <span className="hidden md:inline">•</span>
              <span>🎯 Target Launch: Q2 2026</span>
              <span className="hidden md:inline">•</span>
              <span>📧 Contact: jaykashyap283125@gmail.com</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
