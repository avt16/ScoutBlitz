import React from 'react';
import Header from './Header';
import { getAuth, onAuthStateChanged} from 'firebase/auth';
import { useEffect, useState } from 'react';


function GradientButton({ text, href }) {
  return (
    <a
      href={href}
      className='inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition duration-300'
    >
      {text}
    </a>
  );
}

function FeatureCard({ title, description, icon }) {
  return (
    <div className='bg-white shadow-md rounded-2xl p-6 text-center border hover:shadow-xl transition duration-300'>
      <div className='text-4xl mb-4'>{icon}</div>
      <h3 className='text-xl font-semibold text-gray-800 mb-2'>{title}</h3>
      <p className='text-gray-600'>{description}</p>
    </div>
  );
}

function HomePage() {
  const [user, setUser] = useState(null);
  const scrollToFooter = () => {
    const footer = document.getElementById('page-footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(()=>{
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth,(currentUser)=>{
      setUser(currentUser);
    })
    return () => unsubscribe();
  },[]);

  return (
    <div className='flex flex-col min-h-screen bg-white font-sans'>
      <Header />

      <main className='flex-1'>
        {/* Hero Section */}
        <section className='bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 py-20'>
          <div className='container mx-auto px-6 flex flex-col-reverse md:flex-row items-center justify-between gap-12'>
            <div className='md:w-1/2 text-center md:text-left'>
              <h1 className='text-5xl font-extrabold text-gray-800 leading-tight mb-6'>
                Discover. Connect. <span className='text-indigo-600'>Be Seen.</span>
              </h1>
              <p className='text-lg text-gray-700 mb-6'>
              Showcase your game. Get discovered. ScoutBlitz is your path to the next level.
              </p>
              <button
                onClick={scrollToFooter}
                className='inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition duration-300'>
                Get Started
              </button>
            </div>
            <div className='md:w-1/2'>
              <img
                src='https://images.unsplash.com/photo-1529932398402-e0b30f66a559?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                alt='Placeholder'
                className='rounded-2xl shadow-2xl'
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id='how-it-works' className='py-28 bg-white'>
          <div className='container mx-auto px-6 text-center'>
            <h2 className='text-4xl font-bold text-gray-800 mb-12'>How ScoutBlitz Works</h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-10'>
              <FeatureCard
                title='Create Your Profile'
                description='Build a dynamic athletic profile to showcase your stats, highlights, and goals.'
                icon='👤'
              />
              <FeatureCard
                title='Get Discovered'
                description='Let scouts and coaches find you with our smart discovery tools.'
                icon='🔍'
              />
              <FeatureCard
                title='Grow Your Network'
                description='Communicate with recruiters and expand your reach in the sports world.'
                icon='📈'
              />
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className='bg-gray-50 py-20'>
          <div className='container mx-auto px-6 flex flex-col md:flex-row items-center gap-12'>
            <div className='md:w-1/2'>
              <img
                src='https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?auto=format&fit=crop&w=800&q=80'
                alt='Coach guiding athletes'
                className='rounded-2xl shadow-lg'
              />
            </div>
            <div className='md:w-1/2'>
              <h2 className='text-3xl font-bold text-gray-800 mb-4'>Why ScoutBlitz?</h2>
              <p className='text-gray-700 mb-4'>Raw skill isn’t enough. You need visibility, strategy, and the right connections. ScoutBlitz gives athletes the power to showcase their game, get seen by coaches, and turn potential into progress.</p>
              <p className='text-gray-700'>Whether you're chasing a scholarship or scouting the next standout, ScoutBlitz bridges ambition with opportunity — and puts control back in your hands.</p>
            </div>
          </div>
        </section>

        {/* a==b?true:false */}
        {/* Call to Action */}
        <section className='py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-center'>
          <div className='container mx-auto px-6'>
            <h2 className='text-4xl font-bold mb-6'>Start Building Your Future in Sports</h2>
            <p className='text-lg mb-8'>Thousands of athletes and coaches use ScoutBlitz to connect, get noticed, and take the next step in their journey. Don’t wait—make your move today.</p>
            {user ? (
              <GradientButton text='Go to Profile' href='/profile' />
            ):(
              <GradientButton text='Sign Up Now' href='/signup' />
            )}
          </div>
        </section>
      </main>

      <footer id='page-footer' className='bg-gray-900 text-white py-8'>
        <div className='container mx-auto px-6 flex flex-col md:flex-row justify-between items-center'>
          <p className='text-sm'>&copy; {new Date().getFullYear()} ScoutBlitz. All rights reserved.</p>
          <nav className='flex gap-6 mt-4 md:mt-0'>
            <a href='/about' className='hover:text-gray-300 transition'>About</a>
            <a href='/contact' className='hover:text-gray-300 transition'>Contact</a>
            <a href='/privacy' className='hover:text-gray-300 transition'>Privacy Policy</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;