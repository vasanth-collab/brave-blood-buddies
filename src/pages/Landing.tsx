import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Droplets, Shield, Zap, Users, Heart, ArrowRight, Star } from 'lucide-react';
import bloodDrop from '@/assets/blood-drop.png';

export default function Landing() {
  const features = [
    { icon: Star, title: 'Reliability Scoring', desc: 'Donors ranked by donation history, response rate, and activity' },
    { icon: Zap, title: 'Emergency Priority', desc: 'Critical requests surface first with smart urgency handling' },
    { icon: Shield, title: 'Verified Donors', desc: 'Phone/email verified donors marked with trust badges' },
    { icon: Users, title: 'Smart Matching', desc: 'Find the nearest, most reliable, available donor instantly' },
  ];

  const stats = [
    { value: '10K+', label: 'Registered Donors' },
    { value: '5K+', label: 'Lives Saved' },
    { value: '98%', label: 'Match Rate' },
    { value: '<30min', label: 'Avg Response' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 md:py-32">
        <div className="absolute inset-0 bg-hero-gradient opacity-5" />
        <div className="container mx-auto flex flex-col-reverse lg:flex-row items-center gap-12 relative">
          <div className="flex-1 text-center lg:text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground mb-6">
              <Heart className="h-4 w-4" /> Every Drop Counts
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Smart Blood Donation<br />
              <span className="text-gradient">Powered by Trust</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0">
              Connect with reliable blood donors instantly. Our reliability scoring and emergency priority system ensures the right donor reaches you first.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/register">
                <Button size="lg" className="gap-2 px-8 text-base">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/search">
                <Button size="lg" variant="outline" className="gap-2 px-8 text-base">
                  <Droplets className="h-4 w-4" /> Find Donors
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center animate-slide-up">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150" />
              <img src={bloodDrop} alt="BloodLink" className="relative w-48 md:w-64 animate-pulse-slow" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-card">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 divide-x">
          {stats.map(s => (
            <div key={s.label} className="px-4 py-8 text-center">
              <div className="text-3xl font-bold text-primary">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Why BloodLink?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Smarter than traditional blood banks — we prioritize reliability and urgency
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(f => (
              <Card key={f.title} className="shadow-card hover:shadow-elevated transition-shadow duration-300 border-0 bg-card-gradient">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="container mx-auto">
          <Card className="bg-hero-gradient border-0 shadow-elevated overflow-hidden">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-primary-foreground mb-4">Ready to Save Lives?</h2>
              <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
                Join thousands of donors and help create a reliable blood donation network
              </p>
              <Link to="/register">
                <Button size="lg" variant="secondary" className="gap-2 px-8 text-base font-semibold">
                  Register Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-8">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Droplets className="h-5 w-5 text-primary" /> BloodLink
          </div>
          <p>© {new Date().getFullYear()} BloodLink. Saving lives through smart technology.</p>
        </div>
      </footer>
    </div>
  );
}
