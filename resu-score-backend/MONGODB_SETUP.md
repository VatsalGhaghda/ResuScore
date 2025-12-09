# MongoDB Atlas Setup Instructions

## Step 1: Create MongoDB Atlas Account
1. Go to https://cloud.mongodb.com
2. Sign up for a free account (or sign in if you already have one)

## Step 2: Create a Cluster
1. Click "Create" or "Build a Database"
2. Choose the **FREE** tier (M0 Sandbox)
3. Select a cloud provider and region (choose the closest to you)
4. Click "Create Cluster"

## Step 3: Create Database User
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and password (save these!)
5. Set user privileges to "Read and write to any database"
6. Click "Add User"

## Step 4: Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP address for production
4. Click "Confirm"

## Step 5: Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. It will look like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

## Step 6: Update .env File
1. Open the `.env` file in the backend directory
2. Add your MongoDB connection string:
   ```
   MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/resuscore?retryWrites=true&w=majority
   ```
   - Replace `yourusername` and `yourpassword` with your database user credentials
   - Replace `cluster0.xxxxx` with your actual cluster name
   - The `/resuscore` part is the database name (you can change it)

## Step 7: Test Connection
1. Restart your backend server: `npm run dev`
2. You should see: `✅ MongoDB connected successfully`

## Troubleshooting
- If connection fails, check:
  - Username and password are correct
  - IP address is whitelisted
  - Connection string format is correct
  - Internet connection is active
