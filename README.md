# Llama-Index-demo

Follow the below steps to setup this project

## Pre-Requisites
Download & Install the below tools
#### 1. [Node Js](https://nodejs.org/en)
#### 2. [Python](https://www.python.org/downloads/)
#### 3. [Git](https://git-scm.com/downloads)

## Cloning the repo
Open any terminal & run the below code in to clone the repo in your system.


```bash
git clone https://github.com/NormieNoob/llama-index-demo.git
```

## Running the React.js Client
This is built with [Next.js](https://nextjs.org/) framework, which is based on [React.js](https://https://react.dev/) library.

#### 1. Navigate to client folder
```bash
cd llama-index-demo
cd client
```
#### 2. Install the dependencies
```bash
npm install
```

#### 3. Run the development Server
```bash
npm run dev
```

Now site can be accessed at [http://localhost:3000](http://localhost:3000).

## Running the Flask Server

#### 1. Navigate to server folder
Open a new terminal in the server folder of *llama-index-demo*

or

Navigate to server folder using the terminal 

#### 2. Create a Python virtual Environment

Once you're in the server folder, enter the following command to create a virtual env:

```bash
python3 -m venv venv
```
use *Python* or *Python3* based on your system & installation.

Now activate it with the following command:
```bash
source venv/bin/activate
```

Everytime you're working with the flask server make sure you've activated the virtual env.

#### 3. Install the required packages
 
```bash
pip install -r requirements.txt
```
#### 4. Running the server
```bash
python3 hello.py
```