## 🛠️ Project Setup

### 🔑 Environment Variables

#### In the **root** directory, create a `.env` file:

```bash
MONGO_URI=your_own_key
JWT_SECRET=your_own_key
EMAIL_USER=harshshahswe@gmail.com
EMAIL_PASS="ohnr tjaz avsq vctx"
OPENAI_API_KEY=your_own_key
```
#### In the **frontend** directory, create a `.env` file:

```bash
REACT_APP_PDFTRON_KEY=your_own_key
```

---

## 🚀 Project Startup

### Start Backend

```bash
# From root directory
npm install
npm run dev
```

### Start Frontend

```bash
# From root directory
cd frontend
npm install
npm start
```

### Start Recommender

```bash
# From root directory
cd recommender
pip install -r requirements.txt
python app.py
```

Note: For the recommender you need to have redis installed and running locally or remotely. 

- **macOS:**

```bash
brew install redis
brew services start redis
```

- **Ubuntu:**

```bash
brew install redis
brew services start redis
```

- **Windows**

You can install docker desktop and run

```bash
docker run -p 6379:6379 redis
```
