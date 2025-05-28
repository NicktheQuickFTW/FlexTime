from setuptools import setup, find_packages

setup(
    name="intelligence_engine",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "flask==2.2.3",
        "flask-cors==3.0.10",
        "waitress==2.1.2",
        "numpy==1.24.2",
        "pandas==1.5.3",
        "scipy==1.10.1",
        "scikit-learn==1.2.2",
        "torch==2.0.0",
        "transformers==4.27.2",
        "pulp==2.7.0",
        "ortools==9.6.2534",
        "redis==4.5.4",
        "psycopg2-binary==2.9.5",
        "pydantic==1.10.7",
        "python-dotenv==1.0.0",
        "pytz==2023.3",
        "ujson==5.7.0",
        "werkzeug==2.2.3"
    ],
    entry_points={
        'console_scripts': [
            'intelligence-engine=intelligence_engine.__main__:main',
        ],
    },
)