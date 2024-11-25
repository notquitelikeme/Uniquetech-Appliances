// START OF FIREBASE CONFIG

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Google Sign-In button with click handler
document.getElementById("google-signin-btn").addEventListener("click", () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            // Access the user signed-in user info
            const user = result.user;
            console.log("User signed in:", user);
            // Optionally, display the user's name or email in the modal
            alert(`Welcome, ${user.displayName}!`);
        })
        .catch((error) => {
            console.error("Error during sign-in:", error.message);
        });
})

// Sign-Out Button Click Handler
document.getElementById("google-signout-btn").addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            console.log("User signed out successfully.");
            alert("You have signed out.");
        })
        .catch((error) => {
            console.error("Error during sign-out:", error.message);
        });
});

// Show/hide buttons based on user state
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        document.getElementById("google-signin-btn").style.display = "none";
        document.getElementById("google-signout-btn").style.display = "block";
    } else {
        // User is signed out
        document.getElementById("google-signin-btn").style.display = "block";
        document.getElementById("google-signout-btn").style.display = "none";
    }
});

// sign in with email and password
document.getElementById("email-signin-form").addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent form from submitting normally

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in successfully
            const user = userCredential.user;
            console.log("User signed in:", user);
            alert(`Welcome back, ${user.email}!`);
        })
        .catch((error) => {
            // Handle sign-in errors
            console.error("Error signing in:", error.message);
            alert("Sign-in failed: " + error.message);
        });
});

// create user with email and password
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
        .catch((error) => {
            console.error("Error creating user:", error.message);
            alert("Sign-up failed: " + error.message);
        });
});

// firestore config

const db = getFirestore(app);

// Function to fetch products from a single collection
async function fetchProductsFromCollection(collectionName) {
    try {
        const productsCollection = collection(db, collectionName);
        const querySnapshot = await getDocs(productsCollection);
        const products = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            products.push({ id: doc.id, ...data, collectionName });
        });

        return products;
    } catch (error) {
        console.error(`Error fetching products from ${collectionName}:`, error);
        return [];
    }
}

// Function to display all products
async function displayAllProducts() {
    try {
        const allCollections = ["Phones", "Fridges", "TVs", "Microwaves"];
        let allProducts = [];
        const productsContainer = document.querySelector("#all-products");

        // Fetch products from all collections
        for (const collectionName of allCollections) {
            const products = await fetchProductsFromCollection(collectionName);
            allProducts.push(...products);
        }

        // Store all products globally for filtering
        window.allProductsData = allProducts;
        renderProducts(allProducts, productsContainer); // Pass products with collectionName
    } catch (error) {
        console.error("Error displaying all products:", error);
    }
}


// Function to render products
function renderProducts(products, container) {
    container.innerHTML = ""; // Clear container
    products.forEach((product) => {
        const productElement = document.createElement("div");
        productElement.className = "product";
        productElement.innerHTML = `
        <a href="product-details.html?productId=${product.id}&collection=${product.collectionName}">
            <img src="${sanitizeUrl(product.image1 || 'placeholder.jpg')}" alt="${product.id}" />
            <p>${product.id}</p>
            <span>KES ${product.Price.toLocaleString()}</span><br>
            <button class="add-to-cart-btn" data-product="${product.id}" data-collection="${product.collectionName}">Add to cart</button>
        </a>`;
        container.appendChild(productElement);
    });

    // Attach event listeners to "Add to Cart" buttons
    const addToCartButtons = container.querySelectorAll(".add-to-cart-btn");
    addToCartButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            const productId = event.target.getAttribute("data-product");
            const collectionName = event.target.getAttribute("data-collection");
            addToCart(collectionName, productId);
        });
    });
}



// Function to filter products based on dropdown selections
function applyFilters() {
    const collectionFilter = document.querySelector("#collectionFilter").value;
    const brandFilter = document.querySelector("#brandFilter").value;
    const productsContainer = document.querySelector("#all-products");

    // Filter products
    let filteredProducts = window.allProductsData;
    if (collectionFilter !== "all") {
        filteredProducts = filteredProducts.filter((product) => product.collectionName === collectionFilter);
    }
    if (brandFilter !== "all") {
        filteredProducts = filteredProducts.filter((product) => product.Brand === brandFilter);
    }

    // Render filtered products
    renderProducts(filteredProducts, productsContainer);
}

// Function to sanitize URLs
function sanitizeUrl(url) {
    const a = document.createElement("a");
    a.href = url;
    return a.href;
}

// Attach event listeners to dropdowns for filtering
document.querySelector("#collectionFilter").addEventListener("change", applyFilters);
document.querySelector("#brandFilter").addEventListener("change", applyFilters);

// Call the function on page load
window.onload = displayAllProducts;


// cart modal
const cartModal = document.getElementById("cart-modal");
const openCartBtn = document.getElementById("open-cart-btn");
const closeCartBtn = document.querySelector(".close-cart-btn");

// Open cart modal
openCartBtn.addEventListener("click", () => {
    cartModal.style.display = "flex";
    displayCartItems();
});

// Close cart modal
closeCartBtn.addEventListener("click", () => {
    cartModal.style.display = "none";
});

// create cart document when a user signs up
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const cartRef = doc(db, "Carts", user.uid);
        const cartDoc = await getDoc(cartRef);

        if (!cartDoc.exists()) {
            // Only create the cart if it doesn't exist
            await setDoc(cartRef, { items: [] });
            console.log("Cart created for user:", user.uid);
        }
    }
});


// function to add items to cart
async function addToCart(collectionName, productId) {
    const user = auth.currentUser; // Get the current signed-in user
    if (!user) {
        alert("Please sign in to add items to your cart.");
        return;
    }

    try {
        // Reference to the specific product document
        const productRef = doc(db, collectionName, productId);
        const productDoc = await getDoc(productRef);

        if (!productDoc.exists()) {
            console.error(`Product with ID "${productId}" does not exist in collection "${collectionName}".`);
            alert("Product not found.");
            return;
        }

        const productData = productDoc.data();

        // Ensure price is a valid number (fallback to 0 if invalid)
        const price = Number(productData.Price) || 0; 
        const image = productData.image1;

        // Reference to the user's cart document
        const cartRef = doc(db, "Carts", user.uid);
        const cartDoc = await getDoc(cartRef);

        let cartItems = cartDoc.exists() ? cartDoc.data().items || [] : [];

        // Check if the product already exists in the cart
        const existingItem = cartItems.find(item => item.productId === productId);

        if (existingItem) {
            // If the product already exists, increase the quantity
            existingItem.quantity += 1;
        } else {
            // Otherwise, add the product with an initial quantity of 1
            cartItems.push({
                collection: collectionName,
                productId: productId,
                image: image,
                price: price,
                quantity: 1
            });
        }

        // Update the cart in Firestore
        await updateDoc(cartRef, { items: cartItems });

        console.log(`Added product "${productId}" to cart. Current quantity: ${existingItem ? existingItem.quantity : 1}`);
        alert(`Item added to your cart.`);
    } catch (error) {
        console.error("Error adding item to cart:", error.message);
        alert("Failed to add item to cart: " + error.message);
    }
}

async function displayCartItems() {
    const user = auth.currentUser; // Get the current signed-in user
    if (!user) {
        alert("Please sign in to view your cart.");
        return;
    }

    try {
        // Reference the user's cart document
        const cartRef = doc(db, "Carts", user.uid);
        const cartDoc = await getDoc(cartRef);

        if (cartDoc.exists()) {
            const cartData = cartDoc.data();
            const cartItems = cartData.items || [];

            const cartItemsContainer = document.getElementById("cart-items");
            cartItemsContainer.innerHTML = ""; // Clear previous items

            if (cartItems.length === 0) {
                cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
            } else {
                let totalPrice = 0; // Variable to store the total price

                // Iterate through the items and display them
                cartItems.forEach((item, index) => {
                    // Ensure price and quantity are valid numbers
                    const itemPrice = Number(item.price) || 0; // Fallback to 0 if invalid
                    const itemQuantity = Number(item.quantity) || 0; // Fallback to 0 if invalid
                    totalPrice += itemPrice * itemQuantity; // Safely calculate total price

                    const itemElement = document.createElement("div");
                    itemElement.classList.add("cart-item");

                    // Create an HTML structure for the cart item with increase/decrease buttons
                    itemElement.innerHTML = `
                        <div style="display: flex; align-items: center; margin-bottom: 10px;">
                            <img src="${item.image}" alt="${item.productId}" style="width: 50px; height: 50px; margin-right: 10px;" />
                            <div style="flex-grow: 1;">
                                <p><strong>${item.productId}</strong></p>
                                <p>Price: KES ${itemPrice.toLocaleString()}</p>
                                <p>Quantity: ${itemQuantity}</p>
                                <p>Total: KES ${itemPrice * itemQuantity}</p>
                            </div>
                            <button class="decrease-quantity" data-index="${index}" style="margin-right: 5px;">-</button>
                            <button class="increase-quantity" data-index="${index}">+</button>
                        </div>`
                    ;

                    cartItemsContainer.appendChild(itemElement);
                });

                // Display the total price below the cart items
                const totalPriceElement = document.createElement("div");
                totalPriceElement.classList.add("total-price");
                totalPriceElement.innerHTML = `
                    <p><strong>Total Price: KES ${totalPrice.toLocaleString()}</strong></p>`
                ;
                cartItemsContainer.appendChild(totalPriceElement);
            }

            // Add event listeners to increase and decrease quantity buttons
            const decreaseButtons = cartItemsContainer.querySelectorAll(".decrease-quantity");
            const increaseButtons = cartItemsContainer.querySelectorAll(".increase-quantity");

            decreaseButtons.forEach((button) => {
                button.addEventListener("click", () => {
                    updateItemQuantity(user.uid, parseInt(button.dataset.index), -1);
                });
            });

            increaseButtons.forEach((button) => {
                button.addEventListener("click", () => {
                    updateItemQuantity(user.uid, parseInt(button.dataset.index), 1);
                });
            });

        } else {
            console.log("Cart does not exist for this user.");
            document.getElementById("cart-items").innerHTML =
                "<p>Your cart is empty.</p>";
        }
    } catch (error) {
        console.error("Error fetching cart items:", error.message);
        alert("Failed to load cart items: " + error.message);
    }
}


async function updateItemQuantity(userId, itemIndex, change) {
    try {
        const cartRef = doc(db, "Carts", userId);
        const cartDoc = await getDoc(cartRef);

        if (cartDoc.exists()) {
            const cartData = cartDoc.data();
            let cartItems = cartData.items || [];

            // Adjust the quantity of the item
            const updatedQuantity = (cartItems[itemIndex].quantity || 0) + change;
            cartItems[itemIndex].quantity = updatedQuantity;

            // Remove the item if the quantity becomes zero or less
            if (updatedQuantity <= 0) {
                cartItems.splice(itemIndex, 1);
            }

            // Update the cart in Firestore
            await updateDoc(cartRef, { items: cartItems });

            console.log("Cart updated successfully.");
            displayCartItems(); // Refresh the cart display
        } else {
            console.error("Cart document does not exist.");
        }
    } catch (error) {
        console.error("Error updating item quantity:", error.message);
        alert("Failed to update item quantity: " + error.message);
    }
}
document.getElementById("checkout-btn").addEventListener("click", async () => {
    const user = auth.currentUser; // Get the current signed-in user
    if (!user) {
        alert("Please sign in to proceed with checkout.");
        return;
    }

    try {
        // Reference the user's cart document
        const cartRef = doc(db, "Carts", user.uid);

        // Clear the cart by setting the items array to an empty array
        await updateDoc(cartRef, { items: [] });

        // Display success message
        alert("Payment successful");

        // Refresh the cart display to show it as empty
        displayCartItems();
    } catch (error) {
        console.error("Error clearing cart:", error.message);
        alert("Failed to process payment: " + error.message);
    }
});



// END OF FIREBASE CONFIG
// START OF MODAL
// sign in modal
// Get modal elements
const signInModal = document.getElementById("login-modal");
const loginBtn = document.getElementById("login-btn");
const closeBtn = document.querySelector(".close-btn");

// Open modal
loginBtn.addEventListener("click", () => {
    signInModal.style.display = "flex";
});

// Close modal
closeBtn.addEventListener("click", () => {
    signInModal.style.display = "none";
});

// Close modal when clicking outside content
window.addEventListener("click", (e) => {
    if (e.target === signInModal) {
        signInModal.style.display = "none";
    }
});

// sign up modal
const signUpModal = document.getElementById("signup-modal");
const signUpBtn = document.getElementById("signup-btn");
const closeBtn2 = document.querySelector(".close-btn2");

// Open modal
signUpBtn.addEventListener("click", () => {
    signUpModal.style.display = "flex";
});

// Close modal
closeBtn2.addEventListener("click", () => {
    signUpModal.style.display = "none";
});

// Close modal when clicking outside content
window.addEventListener("click", (e) => {
    if (e.target === signUpModal) {
        signUpModal.style.display = "none";
    }
});
// END OF MODAL