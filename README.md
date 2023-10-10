# PrivateGPT

Follow the below steps to setup this project

## Pre-Requisites
Download & Install the below tools
#### 1. [Node Js](https://nodejs.org/en)
#### 2. [Python](https://www.python.org/downloads/)
#### 3. [Git](https://git-scm.com/downloads)
#### 3. [Python Virtual Env](https://pypi.org/project/virtualenv/)
```bash
python3 -m pip install --user virtualenv
```

## Cloning the repo
Open any terminal & run the below code in to clone the repo in your system.


```bash
git clone https://github.com/Maneshgpai/PrivateGPT.git
```

## Running the React.js Client
This is built with [Next.js](https://nextjs.org/) framework, which is based on [React.js](https://https://react.dev/) library.

#### 1. Navigate to client folder
```bash
cd client
```
#### 2. Install the dependencies
```bash
npm install
```

#### 3. Paste client .env file in client folder


#### 4. Run the development Server
```bash
npm run dev
```

## Running backend Flask Server

#### 5. Navigate to server folder
Open a new terminal

```bash
cd server
```

#### 6. Paste server .env file in server folder


#### 7. Create a Python virtual Environment

Once you're in the server folder, enter the following command to create a virtual env:

```bash
python3 -m venv venv
```
Use *Python* or *Python3* based on your system & installation.

Activate virtual env with following command:
```bash
source venv/bin/activate
```

Everytime you're working with the flask server make sure you've activated the virtual env.


#### 8. Install the server packages
 
```bash
pip install -r requirements.txt
```

#### 9. Run the server
```bash
python3 index.py
```

#### 10. Now site can be accessed at [http://localhost:3000](http://localhost:3000).
