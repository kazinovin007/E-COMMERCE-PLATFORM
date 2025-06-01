
import React, { useState, useEffect, useCallback } from 'react';
import { Product, CartItem, ProductCategory, User, SelectedFilterType } from './types';
import { INITIAL_PRODUCTS, CATEGORIES } from './constants';
import Header from './components/Header';
import ProductList from './components/ProductList';
import CartView from './components/CartView';
import FilterBar from './components/FilterBar';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import AdminDashboard from './components/AdminDashboard';
import AboutUsModal from './components/AboutUsModal'; 
import FaqsModal from './components/FaqsModal'; 
import CheckoutModal from './components/CheckoutModal'; // Import CheckoutModal

// Helper to get from localStorage
const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  const storedValue = localStorage.getItem(key);
  if (storedValue) {
    try {
      return JSON.parse(storedValue) as T;
    } catch (error) {
      console.error(`Error parsing localStorage key "${key}":`, error);
      return defaultValue;
    }
  }
  return defaultValue;
};

// Helper to set to localStorage
const setInLocalStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
};

const NEW_ARRIVALS_COUNT = 5;
const ADMIN_EMAIL = 'aayushb963@gmail.com';
const ADMIN_PASSWORD = 'Kazi$2684';

const App: React.FC = () => {
  const [allProducts] = useState<Product[]>(INITIAL_PRODUCTS); 
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => getFromLocalStorage<CartItem[]>('auramart_cart', []));
  const [isCartVisible, setIsCartVisible] = useState<boolean>(false);
  
  const [selectedFilter, setSelectedFilter] = useState<SelectedFilterType>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => getFromLocalStorage<User | null>('auramart_currentUser', null));
  
  const [users, setUsers] = useState<User[]>(() => {
    let initialUsers = getFromLocalStorage<User[]>('auramart_users', []);
    const adminUserIndex = initialUsers.findIndex(u => u.email === ADMIN_EMAIL);

    if (adminUserIndex !== -1) {
      if (initialUsers[adminUserIndex].role !== 'admin' || initialUsers[adminUserIndex].password !== ADMIN_PASSWORD) {
        initialUsers[adminUserIndex] = { ...initialUsers[adminUserIndex], role: 'admin', password: ADMIN_PASSWORD };
      }
    } else {
      initialUsers.push({ id: 'admin001', email: ADMIN_EMAIL, role: 'admin', password: ADMIN_PASSWORD });
    }
    return initialUsers;
  });

  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showSignupModal, setShowSignupModal] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // View State
  const [currentView, setCurrentView] = useState<'shop' | 'adminDashboard'>('shop');

  // Content Modals State
  const [showAboutUsModal, setShowAboutUsModal] = useState<boolean>(false);
  const [showFaqsModal, setShowFaqsModal] = useState<boolean>(false);

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);


  useEffect(() => {
    setInLocalStorage('auramart_cart', cartItems);
  }, [cartItems]);

  useEffect(() => {
    setInLocalStorage('auramart_currentUser', currentUser);
  }, [currentUser]);

  useEffect(() => {
    setInLocalStorage('auramart_users', users);
  }, [users]);

  useEffect(() => {
    let filtered = allProducts;

    if (selectedFilter === 'NEW_ARRIVALS') {
      filtered = [...allProducts].sort((a, b) => parseInt(b.id) - parseInt(a.id)).slice(0, NEW_ARRIVALS_COUNT);
    } else if (selectedFilter !== 'All') {
      filtered = allProducts.filter(p => p.category === selectedFilter);
    }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(lowerCaseSearchTerm) || 
        p.description.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    setDisplayedProducts(filtered);
  }, [selectedFilter, searchTerm, allProducts]);
  
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleSelectFilter = (filter: SelectedFilterType) => {
    setSelectedFilter(filter);
    setSearchTerm(''); 
  };

  const handleAddToCart = useCallback((product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  }, []);

  const handleRemoveFromCart = useCallback((productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) return;
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const toggleCartView = useCallback(() => {
    setIsCartVisible(prev => !prev);
  }, []);

  const cartItemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * (1 + 0.08); // Assuming 8% tax

  // Auth Handlers
  const handleLogin = useCallback((email: string, pass: string): boolean => {
    setAuthError(null);
    const user = users.find(u => u.email === email);
    
    if (user) {
      if (user.role === 'admin' && user.email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
        setCurrentUser(user);
        setShowLoginModal(false);
        setCurrentView('adminDashboard'); 
        return true;
      }
      if (user.role === 'customer' && user.password === pass) { 
        setCurrentUser(user);
        setShowLoginModal(false);
        return true;
      }
    }
    setAuthError("Invalid email or password.");
    return false;
  }, [users]);

  const handleSignup = useCallback((email: string, pass: string): boolean => {
    setAuthError(null);
    if (users.find(u => u.email === email)) {
      setAuthError("Email already exists.");
      return false;
    }
    const newUser: User = { id: `user_${Date.now()}`, email, role: 'customer', password: pass };
    setUsers(prevUsers => [...prevUsers, newUser]);
    setCurrentUser(newUser);
    setShowSignupModal(false);
    alert("Signup successful! You can now log in with your email and the password you just created.");
    return true;
  }, [users]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setCurrentView('shop'); 
  }, []);

  const handleNavigateToAdmin = () => {
    if (currentUser?.role === 'admin') {
      setCurrentView('adminDashboard');
    }
  };
  const handleNavigateToShop = () => {
    setCurrentView('shop');
  };

  // Footer Quick Link Handlers
  const handleSelectShopAll = () => {
    handleSelectFilter('All');
    window.scrollTo(0, 0);
  };

  const handleSelectNewArrivals = () => {
    handleSelectFilter('NEW_ARRIVALS');
    window.scrollTo(0, 0);
  };

  const handleShowAboutUs = () => setShowAboutUsModal(true);
  const handleCloseAboutUs = () => setShowAboutUsModal(false);
  const handleShowFaqs = () => setShowFaqsModal(true);
  const handleCloseFaqs = () => setShowFaqsModal(false);

  // Checkout Handlers
  const handleOpenCheckoutModal = () => {
    setIsCartVisible(false); // Close cart when opening checkout
    setShowCheckoutModal(true);
  };

  const handleCloseCheckoutModal = () => {
    setShowCheckoutModal(false);
  };

  const handleConfirmOrder = (paymentMethod: string) => {
    // Simulate order confirmation
    console.log(`Order confirmed with ${paymentMethod}`);
    alert(`Order successfully placed using ${paymentMethod}! Thank you for shopping with AuraMart.`);
    setCartItems([]); // Clear the cart
    setShowCheckoutModal(false); // Close the checkout modal
  };


  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      <Header
        cartItemCount={cartItemCount}
        onToggleCart={toggleCartView}
        currentUser={currentUser}
        onShowLogin={() => { setAuthError(null); setShowLoginModal(true); }}
        onShowSignup={() => { setAuthError(null); setShowSignupModal(true);}}
        onLogout={handleLogout}
        onNavigateToAdmin={handleNavigateToAdmin}
        onNavigateToShop={handleNavigateToShop}
        currentView={currentView}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />
      <main className="flex-grow container mx-auto">
        {currentView === 'shop' && (
          <>
            <FilterBar 
              categories={CATEGORIES} 
              selectedFilter={selectedFilter} 
              onSelectFilter={handleSelectFilter} 
            />
            <ProductList products={displayedProducts} onAddToCart={handleAddToCart} />
          </>
        )}
        {currentView === 'adminDashboard' && currentUser?.role === 'admin' && (
          <AdminDashboard
            products={allProducts}
            users={users.filter(u => u.role === 'customer')} 
            salesData={[ 
              { name: 'Jan', sales: 4000 }, { name: 'Feb', sales: 3000 },
              { name: 'Mar', sales: 6000 }, { name: 'Apr', sales: 8000 },
              { name: 'May', sales: 5000 }, { name: 'Jun', sales: 7000 },
            ]}
            categorySalesData={[ 
              { name: ProductCategory.ELECTRONICS, value: 400 },
              { name: ProductCategory.APPAREL, value: 300 },
              { name: ProductCategory.HOME_GOODS, value: 200 },
              { name: ProductCategory.BOOKS, value: 150 },
              { name: ProductCategory.SPORTS, value: 250 },
              { name: ProductCategory.BEAUTY, value: 100 },
              { name: ProductCategory.OUTDOORS, value: 180 },
            ]}
          />
        )}
      </main>
      
      {isCartVisible && currentView === 'shop' && (
        <CartView
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveFromCart}
          onCloseCart={toggleCartView}
          onProceedToCheckout={handleOpenCheckoutModal} // Pass handler to CartView
        />
      )}

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onLogin={handleLogin} error={authError} onSwitchToSignup={() => { setShowLoginModal(false); setShowSignupModal(true); setAuthError(null); }} />}
      {showSignupModal && <SignupModal onClose={() => setShowSignupModal(false)} onSignup={handleSignup} error={authError} onSwitchToLogin={() => { setShowSignupModal(false); setShowLoginModal(true); setAuthError(null); }} />}
      
      {showCheckoutModal && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={handleCloseCheckoutModal}
          onConfirmOrder={handleConfirmOrder}
          totalAmount={cartTotal}
        />
      )}

      {showAboutUsModal && <AboutUsModal isOpen={showAboutUsModal} onClose={handleCloseAboutUs} />}
      {showFaqsModal && <FaqsModal isOpen={showFaqsModal} onClose={handleCloseFaqs} />}
      <Footer 
        onSelectShopAll={handleSelectShopAll}
        onSelectNewArrivals={handleSelectNewArrivals}
        onShowAboutUs={handleShowAboutUs}
        onShowFaqs={handleShowFaqs}
      />
    </div>
  );
};

export default App;
