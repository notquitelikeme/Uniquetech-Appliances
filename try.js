// START OF FIREBASE CONFIG

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, updateDoc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBF2cd1vNcNn-pXo9RuGdcIBZ3-Roc1seg",
    authDomain: "uniquetech-efec9.firebaseapp.com",
    projectId: "uniquetech-efec9",
    storageBucket: "uniquetech-efec9.firebasestorage.app",
    messagingSenderId: "34580380568",
    appId: "1:34580380568:web:07ffa58cadfb50cab949ed",
    measurementId: "G-LD7517PX8Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Google Sign-In
document.getElementById("google-signin-btn").addEventListener("click", () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            console.log("User signed in:", user);
            alert(`Welcome, ${user.displayName}!`);
        })
        .catch((error) => console.error("Error during sign-in:", error.message));
});

// Google Sign-Out
document.getElementById("google-signout-btn").addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            console.log("User signed out successfully.");
            alert("You have signed out.");
        })
        .catch((error) => console.error("Error during sign-out:", error.message));
});

// Show/hide buttons based on user state
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById("google-signin-btn").style.display = "none";
        document.getElementById("google-signout-btn").style.display = "block";
    } else {
        document.getElementById("google-signin-btn").style.display = "block";
        document.getElementById("google-signout-btn").style.display = "none";
    }
});

// Sign in with email and password
document.getElementById("email-signin-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("User signed in:", user);
            alert(`Welcome back, ${user.email}!`);
        })
        .catch((error) => alert("Sign-in failed: " + error.message));
});

// Create user with email and password
document.getElementById("email-signup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("User created:", user);
            alert(`Welcome, ${user.email}! Your account has been created.`);
        })
        .catch((error) => alert("Sign-up failed: " + error.message));
});

// Fetch and display products by collection
async function fetchAndDisplayProducts(collectionName, containerId) {
    const collectionRef = collection(db, collectionName);
    const querySnapshot = await getDocs(collectionRef);
    const container = document.getElementById(containerId);

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const productCard = `
        <div class="product">
                <img src="${data.image1}" alt="${doc.id}" />
                <p>${doc.id}</p>
                <span>KES ${data.Price}</span>
                <button id="add-to-cart" data-product="${doc.id}" data-collection="${collectionName}">Add to cart</button>
            </div>
        `;
        container.innerHTML += productCard;
    });

    attachAddToCartListeners(container);
}

// Fetch and display all products
async function displayAllProducts() {
    const allCollections = ["Phones", "Fridges", "TVs", "Microwaves"];
    const productsContainer = document.querySelector("#all-products");

    for (const collectionName of allCollections) {
        const products = await fetchProductsFromCollection(collectionName);
        products.forEach((product) => {
            const productElement = document.createElement("div");
            productElement.className = "product";
            productElement.innerHTML = `
                <img src="${product.image1 || 'placeholder.jpg'}" alt="${product.id}" />
                <p>${product.id}</p>
                <span>KES ${product.Price}</span>
                <button id="add-to-cart" data-product="${product.id}" data-collection="${collectionName}">Add to cart</button>
            `;
            productsContainer.appendChild(productElement);
        });
    }

    attachAddToCartListeners(productsContainer);
}

// Attach add-to-cart event listeners
function attachAddToCartListeners(container) {
    const addToCartButtons = container.querySelectorAll("button[data-product]");
    addToCartButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const productName = button.getAttribute("data-product");
            const collectionName = button.getAttribute("data-collection");
            addToCart(collectionName, productName);
        });
    });
}

// Fetch products from a collection
async function fetchProductsFromCollection(collectionName) {
    const collectionRef = collection(db, collectionName);
    const querySnapshot = await getDocs(collectionRef);
    const products = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({ id: doc.id, ...data });
    });
    return products;
}

// Add to cart functionality
async function addToCart(collectionName, productId) {
    const user = auth.currentUser;
    if (!user) {
        alert("Please sign in to add items to your cart.");
        return;
    }

    try {
        const productRef = doc(db, collectionName, productId);
        const productDoc = await getDoc(productRef);

        if (!productDoc.exists()) {
            alert("Product not found.");
            return;
        }

        const productData = productDoc.data();
        const price = Number(productData.Price) || 0;
        const image = productData.image1;

        const cartRef = doc(db, "Carts", user.uid);
        const cartDoc = await getDoc(cartRef);
        let cartItems = cartDoc.exists() ? cartDoc.data().items || [] : [];

        const existingItem = cartItems.find((item) => item.productId === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cartItems.push({ collection: collectionName, productId, image, price, quantity: 1 });
        }

        await updateDoc(cartRef, { items: cartItems });
        alert(`${productData.Name || productId} has been added to your cart.`);
    } catch (error) {
        console.error("Error adding to cart:", error);
    }
}

// Display products on page load
fetchAndDisplayProducts("Fridges", "fridges-grid");
fetchAndDisplayProducts("Phones", "phones-grid");
fetchAndDisplayProducts("TVs", "tvs-grid");
fetchAndDisplayProducts("Microwaves", "microwaves-grid");
window.onload = displayAllProducts;

// END OF FIREBASE CONFIG
