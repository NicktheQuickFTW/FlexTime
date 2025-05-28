#!/usr/bin/env python3
"""
Big 12 Mileage Calculator
-------------------------
A tool to calculate the driving distances between Big 12 Conference universities.
"""

import math
import tkinter as tk
from tkinter import ttk, messagebox

class MileageCalculator:
    def __init__(self):
        # Big 12 schools with their coordinates (latitude, longitude)
        self.schools = {
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
        }
    
    def calculate_distance(self, origin, destination):
        """
        Calculate the distance between two schools using the Haversine formula.
        Returns distance in miles.
        """
        if origin not in self.schools or destination not in self.schools:
            return None
        
        # Get coordinates
        lat1, lon1 = self.schools[origin]
        lat2, lon2 = self.schools[destination]
        
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
    
    def get_all_distances(self, origin):
        """Get distances from origin to all other schools, sorted by distance."""
        if origin not in self.schools:
            return None
            
        distances = []
        for school in sorted(self.schools.keys()):
            if school != origin:
                distance = self.calculate_distance(origin, school)
                distances.append((school, distance))
        
        # Sort by distance
        return sorted(distances, key=lambda x: x[1])
    
    def get_school_names(self):
        """Return alphabetically sorted list of school names."""
        return sorted(self.schools.keys())


class MileageCalculatorGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Big 12 Mileage Calculator")
        self.root.geometry("700x500")
        self.calculator = MileageCalculator()

        # Configure the grid
        self.root.grid_columnconfigure(0, weight=1)
        self.root.grid_columnconfigure(1, weight=3)
        self.root.grid_rowconfigure(2, weight=1)
        
        # Add styling
        style = ttk.Style()
        style.configure("TLabel", font=("Arial", 12))
        style.configure("TButton", font=("Arial", 12))
        style.configure("Heading.TLabel", font=("Arial", 14, "bold"))
        
        # Origin selection
        ttk.Label(self.root, text="Select Origin School:", style="Heading.TLabel").grid(row=0, column=0, padx=10, pady=10, sticky="w")
        
        self.origin_var = tk.StringVar()
        self.origin_dropdown = ttk.Combobox(self.root, textvariable=self.origin_var, state="readonly", font=("Arial", 12), width=20)
        self.origin_dropdown["values"] = self.calculator.get_school_names()
        self.origin_dropdown.grid(row=0, column=1, padx=10, pady=10, sticky="ew")
        self.origin_dropdown.bind("<<ComboboxSelected>>", self.update_distances)
        
        # Destination selection
        ttk.Label(self.root, text="Select Destination School:", style="Heading.TLabel").grid(row=1, column=0, padx=10, pady=10, sticky="w")
        
        self.destination_var = tk.StringVar()
        self.destination_dropdown = ttk.Combobox(self.root, textvariable=self.destination_var, state="readonly", font=("Arial", 12), width=20)
        self.destination_dropdown["values"] = self.calculator.get_school_names()
        self.destination_dropdown.grid(row=1, column=1, padx=10, pady=10, sticky="ew")
        
        # Calculate button
        self.calculate_button = ttk.Button(self.root, text="Calculate Distance", command=self.calculate_single_distance)
        self.calculate_button.grid(row=1, column=2, padx=10, pady=10)
        
        # Results area
        results_frame = ttk.LabelFrame(self.root, text="Distances from Origin", padding=(10, 5))
        results_frame.grid(row=2, column=0, columnspan=3, padx=10, pady=10, sticky="nsew")
        
        # Configure the results frame grid
        results_frame.grid_columnconfigure(0, weight=3)
        results_frame.grid_columnconfigure(1, weight=1)
        
        # Scrolled text for results
        self.results_area = tk.Text(results_frame, height=15, width=60, font=("Arial", 12))
        self.results_area.grid(row=0, column=0, columnspan=2, padx=5, pady=5, sticky="nsew")
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(results_frame, orient="vertical", command=self.results_area.yview)
        scrollbar.grid(row=0, column=2, sticky="ns")
        self.results_area.configure(yscrollcommand=scrollbar.set)
        
        # Set default selection
        if self.origin_dropdown["values"]:
            self.origin_dropdown.current(0)
            self.update_distances(None)
    
    def update_distances(self, event):
        """Update the distances display when origin school is selected."""
        origin = self.origin_var.get()
        if not origin:
            return
        
        # Update destination dropdown to exclude origin
        destinations = [school for school in self.calculator.get_school_names() if school != origin]
        self.destination_dropdown["values"] = destinations
        if destinations:
            self.destination_dropdown.current(0)
        
        # Get all distances from the selected origin
        distances = self.calculator.get_all_distances(origin)
        
        # Display the results
        self.results_area.delete(1.0, tk.END)
        self.results_area.insert(tk.END, f"Distances from {origin}:\n\n")
        
        for school, distance in distances:
            self.results_area.insert(tk.END, f"{school}: {distance} miles\n")
    
    def calculate_single_distance(self):
        """Calculate and display distance between selected origin and destination."""
        origin = self.origin_var.get()
        destination = self.destination_var.get()
        
        if not origin or not destination:
            messagebox.showwarning("Missing Selection", "Please select both origin and destination schools.")
            return
        
        distance = self.calculator.calculate_distance(origin, destination)
        messagebox.showinfo("Distance Result", f"The distance from {origin} to {destination} is approximately {distance} miles.")


def main():
    root = tk.Tk()
    app = MileageCalculatorGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
