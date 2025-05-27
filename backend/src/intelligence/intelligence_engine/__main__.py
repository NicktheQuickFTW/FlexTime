"""
Main entry point for the HELiiX Intelligence Engine.
"""

import argparse
import logging
import sys
from intelligence_engine.api.app import start_server

def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description='Start the HELiiX Intelligence Engine')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to (default: 0.0.0.0)')
    parser.add_argument('--port', type=int, default=4001, help='Port to bind to (default: 4001)')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    return parser.parse_args()

def main():
    """Main entry point."""
    # Parse command-line arguments
    args = parse_args()
    
    # Configure logging
    log_level = logging.DEBUG if args.debug else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('intelligence_engine.log')
        ]
    )
    
    logger = logging.getLogger('intelligence_engine')
    
    # Log startup information
    logger.info(f"Starting HELiiX Intelligence Engine on {args.host}:{args.port}")
    logger.info(f"Debug mode: {'enabled' if args.debug else 'disabled'}")
    
    # Start the server
    try:
        start_server(host=args.host, port=args.port)
    except Exception as e:
        logger.exception(f"Error starting server: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()