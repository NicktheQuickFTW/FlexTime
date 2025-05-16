#!/usr/bin/env python3
"""
Big 12 Mileage Calculator - Web Version
--------------------------------------
A Flask web application to calculate driving distances between Big 12 Conference universities.
"""

import math
import json
import csv
import io
from flask import Flask, render_template, request, jsonify

# Initialize Flask app
app = Flask(__name__)

# Schools with their coordinates (latitude, longitude)
SCHOOLS = {
    # Big 12 Conference
    "Arizona": (32.2319, -110.9501),  # Tucson, AZ
    "Arizona State": (33.4255, -111.9400),  # Tempe, AZ
    "Baylor": (31.5447, -97.1214),  # Waco, TX
    "BYU": (40.2518, -111.6493),  # Provo, UT
    "Cincinnati": (39.1329, -84.5150),  # Cincinnati, OH
    "Colorado": (40.0076, -105.2659),  # Boulder, CO
    "Houston": (29.7199, -95.3422),  # Houston, TX
    "Iowa State": (42.0266, -93.6465),  # Ames, IA
    "Kansas": (38.9543, -95.2558),  # Lawrence, KS
    "Kansas State": (39.1836, -96.5717),  # Manhattan, KS
    "Oklahoma State": (36.1269, -97.0737),  # Stillwater, OK
    "TCU": (32.7092, -97.3628),  # Fort Worth, TX
    "Texas Tech": (33.5843, -101.8783),  # Lubbock, TX
    "UCF": (28.6024, -81.2001),  # Orlando, FL
    "Utah": (40.7649, -111.8421),  # Salt Lake City, UT
    "West Virginia": (39.6480, -79.9561),  # Morgantown, WV
    
    # Additional Schools
    "UNC": (40.4044, -104.6970),  # Northern Colorado - Greeley, CO
    "SDSU": (44.3198, -96.7840),  # South Dakota State - Brookings, SD
    "NDSU": (46.8917, -96.8003),  # North Dakota State - Fargo, ND
    "UVU": (40.2769, -111.7143),  # Utah Valley University - Orem, UT
    "WYO": (41.3149, -105.5666),  # Wyoming - Laramie, WY
    "ASU": (38.3050, -76.3678),  # Adams State University - Alamosa, CO
    "ISU": (40.5109, -105.0746),  # Idaho State University - Pocatello, ID
    "MU": (38.9404, -92.3277),  # Missouri - Columbia, MO
    "UNI": (42.5143, -92.4616),  # Northern Iowa - Cedar Falls, IA
    "OU": (35.2058, -97.4457),  # Oklahoma - Norman, OK
    "OSU": (45.4146, -123.0593),  # Oregon State - Corvallis, OR
    "WWU": (48.7331, -122.4869),  # Western Washington - Bellingham, WA
    "CBU": (33.9269, -117.4282),  # California Baptist - Riverside, CA
    "AF": (38.9983, -104.8613),  # Air Force - Colorado Springs, CO
}


def calculate_distance(origin, destination):
    """
    Calculate the distance between two schools using the Haversine formula.
    Returns distance in miles.
    """
    if origin not in SCHOOLS or destination not in SCHOOLS:
        return None
    
    # Get coordinates
    lat1, lon1 = SCHOOLS[origin]
    lat2, lon2 = SCHOOLS[destination]
    
    # Convert to radians
    lat1, lon1 = math.radians(lat1), math.radians(lon1)
    lat2, lon2 = math.radians(lat2), math.radians(lon2)
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    # Earth radius in miles
    radius = 3959
    
    # Calculate distance
    distance = radius * c
    
    # Add 10% to approximate driving distance vs direct distance
    driving_distance = distance * 1.1
    
    return round(driving_distance)


def get_all_distances(origin):
    """Get distances from origin to all other schools, sorted by distance."""
    if origin not in SCHOOLS:
        return None
        
    distances = []
    for school in sorted(SCHOOLS.keys()):
        if school != origin:
            distance = calculate_distance(origin, school)
            distances.append({"school": school, "distance": distance})
    
    # Sort by distance
    return sorted(distances, key=lambda x: x["distance"])


def calculate_multi_trip_distance(schools, include_return=False, cost_per_mile=0.70):
    """Calculate the total distance for a multi-stop trip."""
    if not schools or len(schools) < 2:
        return {"error": "Need at least two schools for a trip"}
    
    total_distance = 0
    legs = []
    
    # If return trip is requested, add the first school to the end of the list
    trip_schools = schools.copy()
    if include_return and len(trip_schools) >= 2:
        trip_schools.append(trip_schools[0])
    
    # Calculate distance for each leg of the journey
    for i in range(len(trip_schools) - 1):
        origin = trip_schools[i]
        destination = trip_schools[i + 1]
        
        if origin not in SCHOOLS or destination not in SCHOOLS:
            return {"error": f"Invalid school: {origin if origin not in SCHOOLS else destination}"}
        
        distance = calculate_distance(origin, destination)
        total_distance += distance
        legs.append({
            "origin": origin,
            "destination": destination,
            "distance": distance
        })
    
    # Calculate trip cost based on distance
    estimated_cost = round(total_distance * cost_per_mile, 2)
    
    return {
        "total_distance": total_distance,
        "legs": legs,
        "schools": trip_schools,
        "estimated_cost": estimated_cost,
        "round_trip": include_return
    }


def process_schedule_matrix(matrix_data):
    """Process a complete schedule matrix and calculate distances."""
    if not matrix_data or len(matrix_data) < 2:
        return {"error": "Invalid matrix data"}
    
    # First row contains headers (school codes)
    headers = matrix_data[0]
    
    # Initialize results structure
    total_miles = 0
    trips = []
    school_totals = {}
    
    # Process each row (home school and its away games)
    for r in range(1, len(matrix_data)):
        row = matrix_data[r]
        home_school = row[0]  # First column is home school
        
        if home_school not in SCHOOLS:
            return {"error": f"Invalid home school: {home_school}"}
        
        # Initialize school totals if this is first occurrence
        if home_school not in school_totals:
            school_totals[home_school] = 0
        
        # Process each away game for this home school
        for c in range(1, len(row)):
            if c >= len(headers):
                continue
                
            away_school = row[c]
            
            if not away_school or away_school not in SCHOOLS:
                continue
            
            # Calculate distance for this matchup
            distance = calculate_distance(home_school, away_school)
            
            # Add to total and tracking
            total_miles += distance
            school_totals[home_school] = school_totals.get(home_school, 0) + distance
            
            # Add the away school's travel also
            if away_school not in school_totals:
                school_totals[away_school] = 0
            school_totals[away_school] += distance
            
            # Track individual trip
            trips.append({
                "home": home_school,
                "away": away_school,
                "distance": distance
            })
    
    # Sort schools by total miles traveled
    sorted_schools = sorted(school_totals.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "total_miles": total_miles,
        "trips": trips,
        "school_totals": [{"school": s[0], "miles": s[1]} for s in sorted_schools],
        "num_matchups": len(trips)
    }


def find_optimal_travel_pairs(home_school, schools_to_visit):
    """Find the optimal order to visit schools to minimize total distance."""
    if home_school not in SCHOOLS:
        return {"error": "Invalid home school"}
    
    # Validate all schools
    for school in schools_to_visit:
        if school not in SCHOOLS:
            return {"error": f"Invalid school: {school}"}
    
    # If only one school to visit, just return direct trip
    if len(schools_to_visit) <= 1:
        return calculate_multi_trip_distance([home_school] + schools_to_visit + [home_school], False)
    
    # Calculate all possible permutations of schools to visit
    from itertools import permutations
    best_distance = float('inf')
    best_route = None
    best_perm = None
    
    for perm in permutations(schools_to_visit):
        route = [home_school] + list(perm) + [home_school]
        total_dist = 0
        
        for i in range(len(route) - 1):
            total_dist += calculate_distance(route[i], route[i + 1])
        
        if total_dist < best_distance:
            best_distance = total_dist
            best_route = route
            best_perm = perm
    
    # Identify travel pairs based on distance
    travel_pairs = []
    for i in range(len(best_perm) - 1):
        school1 = best_perm[i]
        school2 = best_perm[i + 1]
        pair_distance = calculate_distance(school1, school2)
        if pair_distance < 400:  # Pairs should be reasonably close
            travel_pairs.append({
                "schools": [school1, school2],
                "distance": pair_distance
            })
    
    result = calculate_multi_trip_distance(best_route, False)
    result["travel_pairs"] = travel_pairs
    result["optimized"] = True
    
    return result


@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html', schools=sorted(SCHOOLS.keys()))


@app.route('/calculate', methods=['POST'])
def calculate():
    """Calculate distances based on the selected origin."""
    data = request.get_json()
    origin = data.get('origin')
    
    if not origin or origin not in SCHOOLS:
        return jsonify({"error": "Invalid origin school"}), 400
    
    distances = get_all_distances(origin)
    return jsonify({"distances": distances})


@app.route('/distance', methods=['POST'])
def distance():
    """Calculate distance between two specific schools."""
    data = request.get_json()
    origin = data.get('origin')
    destination = data.get('destination')
    
    if not origin or not destination:
        return jsonify({"error": "Both origin and destination are required"}), 400
        
    if origin not in SCHOOLS or destination not in SCHOOLS:
        return jsonify({"error": "Invalid school selection"}), 400
    
    distance = calculate_distance(origin, destination)
    return jsonify({"distance": distance})


@app.route('/multi-trip', methods=['POST'])
def multi_trip():
    """Calculate multi-trip distance from a list of schools."""
    include_return = False
    cost_per_mile = 4.50  # Default cost per mile
    optimize_route = False
    home_school = None
    
    if 'csv_file' in request.files:
        # Handle CSV file upload
        csv_file = request.files['csv_file']
        if csv_file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Get optional parameters from form data
        if 'include_return' in request.form:
            include_return = request.form.get('include_return') in ['true', 'True', '1', 'yes']
        
        if 'cost_per_mile' in request.form and request.form.get('cost_per_mile'):
            try:
                cost_per_mile = float(request.form.get('cost_per_mile'))
            except ValueError:
                pass  # Use default if conversion fails
        
        if 'optimize_route' in request.form:
            optimize_route = request.form.get('optimize_route') in ['true', 'True', '1', 'yes']
        
        # Read schools from CSV
        try:
            stream = io.StringIO(csv_file.stream.read().decode("UTF8"), newline='')
            csv_reader = csv.reader(stream)
            schools = []
            for row in csv_reader:
                if row and len(row) > 0:
                    school = row[0].strip()
                    if school in SCHOOLS:
                        schools.append(school)
            
            if len(schools) < 2:
                return jsonify({"error": "CSV must contain at least two valid school names"}), 400
            
            if optimize_route:
                home_school = schools[0]
                schools_to_visit = schools[1:]
                result = find_optimal_travel_pairs(home_school, schools_to_visit)
            else:
                result = calculate_multi_trip_distance(schools, include_return, cost_per_mile)
                
            return jsonify(result)
            
        except Exception as e:
            return jsonify({"error": f"Error processing CSV: {str(e)}"}), 400
    elif request.is_json:
        # Handle JSON data
        data = request.get_json()
        schools = data.get('schools', [])
        include_return = data.get('include_return', False)
        cost_per_mile = data.get('cost_per_mile', 4.50)
        optimize_route = data.get('optimize_route', False)
        
        if len(schools) < 2:
            return jsonify({"error": "Need at least two schools for a trip"}), 400
        
        if optimize_route:
            home_school = schools[0]
            schools_to_visit = schools[1:]
            result = find_optimal_travel_pairs(home_school, schools_to_visit)
        else:
            result = calculate_multi_trip_distance(schools, include_return, cost_per_mile)
            
        return jsonify(result)
    else:
        return jsonify({"error": "Invalid request format"}), 400


@app.route('/optimize-trip', methods=['POST'])
def optimize_trip():
    """Find the optimal travel route for visiting multiple schools."""
    data = request.get_json()
    home_school = data.get('home_school')
    schools_to_visit = data.get('schools_to_visit', [])
    
    if not home_school:
        return jsonify({"error": "Home school is required"}), 400
    
    if len(schools_to_visit) < 1:
        return jsonify({"error": "Need at least one school to visit"}), 400
    
    result = find_optimal_travel_pairs(home_school, schools_to_visit)
    return jsonify(result)


@app.route('/process-matrix', methods=['POST'])
def process_matrix():
    """Process a schedule matrix from CSV file and calculate all distances."""
    if 'matrix_file' in request.files:
        # Handle CSV file upload
        matrix_file = request.files['matrix_file']
        if matrix_file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Get cost per mile for estimating travel costs
        cost_per_mile = 0.70  # Default
        if 'cost_per_mile' in request.form and request.form.get('cost_per_mile'):
            try:
                cost_per_mile = float(request.form.get('cost_per_mile'))
            except ValueError:
                pass  # Use default if conversion fails
        
        # Read matrix from CSV
        try:
            stream = io.StringIO(matrix_file.stream.read().decode("UTF8"), newline='')
            csv_reader = csv.reader(stream)
            matrix_data = [row for row in csv_reader]
            
            if len(matrix_data) < 2:
                return jsonify({"error": "CSV must contain at least a header row and one data row"}), 400
                
            result = process_schedule_matrix(matrix_data)
            
            # Add cost estimation to the result
            if 'total_miles' in result:
                result['estimated_cost'] = round(result['total_miles'] * cost_per_mile, 2)
                
            return jsonify(result)
            
        except Exception as e:
            return jsonify({"error": f"Error processing CSV: {str(e)}"}), 400
    else:
        return jsonify({"error": "No matrix file provided"}), 400


if __name__ == '__main__':
    # Create the templates directory if it doesn't exist
    import os
    templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
    os.makedirs(templates_dir, exist_ok=True)
    
    # Start the Flask server
    app.run(debug=True, host='0.0.0.0', port=8082)
