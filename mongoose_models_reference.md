# Second Muma MongoDB Models Reference

Below are all the Mongoose schema (model) definitions that have been created for the Second Muma backend. These are currently structured as separate files inside the `/Users/bharathkr/Desktop/IOS_Learning/SM_RNC/sm-backend/src/models/` directory.

Through Mongoose, MongoDB will automatically create collections (`users`, `otps`, `addresses`, `orders`, `payments`) based on these schemas as soon as you insert the first record.

---

### 1. User Model (`models/User.js`)
Manages fundamental user profile details.
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, trim: true, default: '' },
    email: { type: String, lowercase: true, trim: true, default: '' },
    mobile: { 
        type: String, 
        required: [true, 'Mobile number is required'], 
        unique: true, 
        trim: true,
        match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number']
    },
    isVerified: { type: Boolean, default: false },
    avatar: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

### 2. OTP Model (`models/OTP.js`)
For phone number authentication. Contains a TTL index so MongoDB automatically deletes expired OTPs.
```javascript
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    mobile: { type: String, required: true, trim: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
}, { timestamps: true });

// Auto-delete expired OTPs from MongoDB automatically
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.methods.markUsed = function () {
    this.used = true;
    return this.save();
};

module.exports = mongoose.model('OTP', otpSchema);
```

### 3. Address Model (`models/Address.js`)
Manages the user's shipping/billing locations matching the `CheckoutScreen` UI.
```javascript
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    flatNo: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Address', addressSchema);
```

### 4. Order Model (`models/Order.js`)
Represents what was bought (Mother/Baby/Muma subscription). Includes a permanent snapshot of the shipping address.
```javascript
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Package Details
    packageType: { type: String, required: true, enum: ['mother', 'baby', 'muma'] },
    packageTitle: { type: String, required: true },
    planKey: { type: String, required: true, enum: ['1month', '3month', '6month'] },
    planLabel: { type: String, required: true },
    price: { type: Number, required: true },
    emoji: { type: String, default: '' },
    accentColor: { type: String, default: '#E91E8A' },
    
    // Delivery address (snapshot at time of checkout)
    address: {
        fullName: { type: String, required: true },
        mobile:   { type: String, required: true },
        flatNo:   { type: String, required: true },
        street:   { type: String, required: true },
        city:     { type: String, required: true },
        state:    { type: String, required: true },
        pincode:  { type: String, required: true },
    },
    
    // Status markers
    paymentStatus: { type: String, enum: ['pending', 'processing', 'success', 'failed', 'refunded'], default: 'pending' },
    transactionId: { type: String, default: null },
    status: { type: String, enum: ['created', 'active', 'completed', 'cancelled'], default: 'created' },
    
    // Active subscription timelines
    activatedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
```

### 5. Payment Model (`models/Payment.js`)
Specifically focused on logging interactions with UPI systems or third-party gateways.
```javascript
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transactionId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    
    // External tracking parameters
    upiId: { type: String, default: '' },
    upiRef: { type: String, default: '' },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    
    status: { type: String, enum: ['initiated', 'pending', 'success', 'failed', 'refunded'], default: 'initiated' },
    paidAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
```
