# Siborg Stellar Client

Siborg is a decentralized platform for managing and sponsoring advertising spaces as NFTs on the Stellar blockchain.

## Main Features
- Create advertising space offers (NFTs)
- Buy/mint nft by paying for the offer ( ad space buy)
- Validate and manage ad proposals
- Stellar blockchain (Soroban) integration

## Project Structure

```
client/src/
  Components/
    offer/      # Components related to offers (creation, details, validation, etc.)
    token/      # Components related to tokens (NFTs, cards, lists, etc.)
    common/     # Reusable components (notifications, navbar, etc.)
  hooks/
    offer/      # Offer-specific hooks
    token/      # Token-specific hooks
    ...
  pages/        # Main application pages (OfferPage, Create, etc.)
  styles/       # Global style files
  utils/        # Utility functions
```

## Installation

## Docker Deployment

1. **Build the Docker image**
```bash
docker build -t siborg-client .
```

2. **Run the container**
```bash
docker run -p 3000:3000 siborg-client
```

3. **Access the application**
- The application will be available at `http://localhost:3000`

### Docker Compose (Optional)
If you prefer using Docker Compose, create a `docker-compose.yml` file:

```yaml
version: '3'
services:
  siborg-client:
    build: .
    ports:
      - "3000:3000"
```

Then run:
```bash
docker-compose up
```

## Normal Deployment

1. **Clone the repository**
```bash
git clone <repo-url>
cd Siborg
```

2. **Install dependencies**

Make sure to install the Stellar CLI before running this command, as it is used in the postinstall step.

```bash
npm install
# or
yarn install
```

3. **Configure environment variables**
- No env need

4. **Start the project**
```bash
npm run dev
# or
yarn dev
```

## Quick Start
- Go to `http://localhost:5173` to use the app.
- Create an offer, manage your tokens, validate ads!


## Contributing
Pull requests are welcome!

## License
MIT 