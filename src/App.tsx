import React from 'react';
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { HomePage, Marketplace, Profile, Create, OfferPage, TokenPage } from "./pages";
import Footer from './Components/common/Footer';
import { StellarWalletProvider } from "./web3/index";

/**
 * Main Application Component
 * Handles routing and main layout structure
 */
const App: React.FC = () => {
  return (
    <StellarWalletProvider version={"testnet"} chain={"stellart" as string}>
    <div className="min-h-screen flex flex-col">
      <Router>
        <div className="flex flex-col flex-1">
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/market" element={<Marketplace />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/create" element={<Create />} />
              <Route path="/offer" element={<OfferPage />} />
              <Route path="/offer/:id" element={<OfferPage />} />
              <Route path="/token" element={<TokenPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </div>
    </StellarWalletProvider>
  );
};

export default App;
