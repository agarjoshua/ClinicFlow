import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  ArrowRight,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Shield,
  Zap,
  Clock,
  Heart,
  ChevronRight,
  Star,
  Building2,
  Stethoscope,
  Activity,
} from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-white scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
              <img 
                src="/zahaniflow.png" 
                alt="ZahaniFlow" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ZahaniFlow
              </span>
            </button>
            
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </button>
              <button onClick={() => scrollToSection('testimonials')} className="text-gray-600 hover:text-gray-900 transition-colors">
                Testimonials
              </button>
              <Button
                variant="ghost"
                onClick={() => setLocation("/auth")}
              >
                Sign In
              </Button>
              <Button
                onClick={() => setLocation("/auth")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
              <Zap className="h-3 w-3 mr-1" />
              Transform Your Healthcare Practice
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
              Modern Healthcare
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Management Made Simple
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Streamline your clinic operations with our all-in-one platform. Manage patients, 
              appointments, medical records, and team collaboration effortlessly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => setLocation("/auth")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-6"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="mt-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-4 shadow-2xl border border-gray-200">
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 md:p-4 border border-blue-200">
                      <div className="text-xs md:text-sm text-blue-600 font-medium mb-1">Total Patients</div>
                      <div className="text-2xl md:text-3xl font-bold text-blue-700">152</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 md:p-4 border border-green-200">
                      <div className="text-xs md:text-sm text-green-600 font-medium mb-1">Appointments</div>
                      <div className="text-2xl md:text-3xl font-bold text-green-700">47</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 md:p-4 border border-purple-200">
                      <div className="text-xs md:text-sm text-purple-600 font-medium mb-1">Procedures</div>
                      <div className="text-2xl md:text-3xl font-bold text-purple-700">23</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 md:p-4 border border-orange-200">
                      <div className="text-xs md:text-sm text-orange-600 font-medium mb-1">Active</div>
                      <div className="text-2xl md:text-3xl font-bold text-orange-700">12</div>
                    </div>
                  </div>
                  {/* Patient List */}
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex items-center gap-3 md:gap-4 bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm md:text-base">JD</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm md:text-base truncate">John Doe</div>
                        <div className="text-xs md:text-sm text-gray-600 truncate">Appointment Today • 2:00 PM</div>
                      </div>
                      <div className="text-xs font-medium text-green-600 bg-green-100 px-2 md:px-3 py-1 rounded-full whitespace-nowrap">Confirmed</div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm md:text-base">SM</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm md:text-base truncate">Sarah Miller</div>
                        <div className="text-xs md:text-sm text-gray-600 truncate">Surgery Tomorrow • 9:00 AM</div>
                      </div>
                      <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 md:px-3 py-1 rounded-full whitespace-nowrap">Scheduled</div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm md:text-base">MB</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm md:text-base truncate">Michael Brown</div>
                        <div className="text-xs md:text-sm text-gray-600 truncate">Follow-up • Post-Op Day 3</div>
                      </div>
                      <div className="text-xs font-medium text-orange-600 bg-orange-100 px-2 md:px-3 py-1 rounded-full whitespace-nowrap">Active</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "3+", label: "Total Clinics" },
              { number: "6+", label: "Total Users" },
              { number: "152+", label: "Total Patients" },
              { number: "99.9%", label: "Uptime" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-blue-100 text-sm md:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 mb-4">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything you need to manage
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                your healthcare practice
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed specifically for modern healthcare providers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Patient Management",
                description: "Comprehensive patient records with medical history, allergies, and treatment plans all in one place.",
                color: "blue",
              },
              {
                icon: Calendar,
                title: "Smart Scheduling",
                description: "Intelligent appointment booking with calendar sync, reminders, and multi-location support.",
                color: "blue",
              },
              {
                icon: FileText,
                title: "Medical Records",
                description: "Secure digital records with easy access to diagnoses, prescriptions, and test results.",
                color: "blue",
              },
              {
                icon: BarChart3,
                title: "Analytics & Reports",
                description: "Real-time insights into your practice with customizable dashboards and detailed reports.",
                color: "blue",
              },
              {
                icon: Shield,
                title: "HIPAA Compliant",
                description: "Enterprise-grade security with end-to-end encryption and compliance with healthcare regulations.",
                color: "blue",
              },
              {
                icon: Stethoscope,
                title: "Clinical Workflow",
                description: "Streamlined workflows for consultations, procedures, discharges, and follow-ups.",
                color: "blue",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200"
              >
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-4 flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
                    Learn more
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 mb-4">
              Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that's right for your practice
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Starter",
                price: "USD 39",
                period: "per month",
                description: "Perfect for small practices",
                features: [
                  "Up to 100 patients",
                  "1 consultant account",
                  "2 assistant accounts",
                  "Basic reporting",
                  "Email support",
                  "Patient management",
                  "Appointment scheduling",
                ],
                popular: false,
              },
              {
                name: "Professional",
                price: "USD 116",
                period: "per month",
                description: "For growing practices",
                features: [
                  "Unlimited patients",
                  "Up to 5 consultant accounts",
                  "Up to 10 assistant accounts",
                  "Advanced analytics",
                  "Priority support",
                  "Multi-location support",
                  "Custom branding",
                  "API access",
                  "Advanced reporting",
                ],
                popular: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "contact sales",
                description: "For large organizations",
                features: [
                  "Everything in Professional",
                  "Unlimited users",
                  "Dedicated account manager",
                  "Custom integrations",
                  "Advanced security",
                  "SLA guarantee",
                  "Custom training",
                  "White-label options",
                ],
                popular: false,
              },
            ].map((plan, index) => (
              <Card
                key={index}
                className={`relative ${
                  plan.popular
                    ? "border-2 border-blue-600 shadow-2xl scale-105"
                    : "border-2 border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    {plan.price !== "Custom" && (
                      <span className="text-gray-600 ml-2">/{plan.period}</span>
                    )}
                  </div>
                  <Button
                    className={`w-full mb-8 ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        : "bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setLocation("/auth")}
                  >
                    {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                  </Button>
                  <div className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 mb-4">
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Loved by healthcare professionals
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what doctors and clinic managers say about ZahaniFlow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Dr. Sarah Johnson",
                role: "Neurosurgeon, Metro Hospital",
                avatar: "SJ",
                content: "ZahaniFlow has transformed how we manage our neurosurgery practice. The patient tracking and surgical workflow features are exceptional.",
                rating: 5,
              },
              {
                name: "Dr. Michael Chen",
                role: "Chief of Surgery, City Medical Center",
                avatar: "MC",
                content: "The best healthcare management system I've used in 20 years of practice. Intuitive, powerful, and saves us hours every day.",
                rating: 5,
              },
              {
                name: "Lisa Martinez",
                role: "Practice Manager, Wellness Clinic",
                avatar: "LM",
                content: "Our clinic's efficiency has increased by 40% since switching to ZahaniFlow. The scheduling and reporting features are game-changers.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card key={index} className="border-2 border-gray-100 hover:border-blue-200 transition-colors">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-indigo-600 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to transform your practice?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of healthcare professionals using ZahaniFlow
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setLocation("/auth")}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
            >
              Schedule Demo
            </Button>
          </div>
          <p className="mt-6 text-blue-100">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">ZahaniFlow</span>
              </div>
              <p className="text-sm">
                Modern healthcare management for the digital age.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">HIPAA Compliance</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 ZahaniFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
