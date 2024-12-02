import React from "react";
import Navbar from './navBar';
import { useLocation } from "react-router-dom";

const Home = () =>{
    const location = useLocation();
    const {sucessMessage} = location.state || {};
    return(
        <div>
            <Navbar/>
            <div className="Home-Page"></div>
            {sucessMessage && (
                <>
                    <p style={{textAlign: 'center', fontSize: '1.2rem', color: 'green'}}>{sucessMessage}</p>
                    {console.log('Login Success Message:', sucessMessage)}
                    {console.log('User ID:', localStorage.getItem('token'))}
                </>
            )}
            {console.log({sucessMessage})}

            <section className="hero-section">
                <div className="hero-content">
                    <h1>Discover the Best Recipes</h1>
                    <p>Explore a wide range of delicious recipes from around the world.</p>
                </div>
            </section>
            <section className="featured-section">
                <h2>Featured Section</h2>
                <div className="featues">
                    <h1>Recipe Book</h1>
                    <p>Collect and organize all your recipes in one place.</p>
                    <h1>Meal Planner</h1>
                    <p>Plan your meals for the week, and generate a grocery list.</p>
                </div>
            </section>
        </div>
    );
};

export default Home;
