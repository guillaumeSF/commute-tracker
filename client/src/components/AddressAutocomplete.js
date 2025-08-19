import React, { useState, useEffect, useRef } from 'react';

// Global state to track if Google Maps is already loaded
let googleMapsLoaded = false;
let googleMapsLoading = false;
let googleMapsCallbacks = [];

const AddressAutocomplete = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  onAddressSelect 
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(googleMapsLoaded);
  const containerRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (googleMapsLoaded) {
        setIsGoogleLoaded(true);
        initializeAutocomplete();
        return;
      }

      if (googleMapsLoading) {
        // Add this component to the callback queue
        googleMapsCallbacks.push(() => {
          setIsGoogleLoaded(true);
          initializeAutocomplete();
        });
        return;
      }

      googleMapsLoading = true;

      // Load Google Maps JavaScript API with Places library
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      
      // Set up global callback
      window.initGoogleMaps = () => {
        googleMapsLoaded = true;
        googleMapsLoading = false;
        
        // Execute all queued callbacks
        googleMapsCallbacks.forEach(callback => callback());
        googleMapsCallbacks = [];
        
        // Execute this component's callback
        setIsGoogleLoaded(true);
        initializeAutocomplete();
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();

    return () => {
      // Cleanup: remove this component from callback queue
      const index = googleMapsCallbacks.findIndex(callback => callback === initializeAutocomplete);
      if (index > -1) {
        googleMapsCallbacks.splice(index, 1);
      }
    };
  }, []);

  useEffect(() => {
    if (isGoogleLoaded && containerRef.current) {
      initializeAutocomplete();
    }
  }, [isGoogleLoaded]);

  const initializeAutocomplete = () => {
    if (!containerRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    try {
      // Create the autocomplete object using the legacy API (still supported)
      autocompleteRef.current = new window.google.maps.places.Autocomplete(containerRef.current.querySelector('input'), {
        types: ['address'],
        componentRestrictions: {}, // You can add country restrictions here if needed
      });

      // Listen for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        
        if (place && place.formatted_address) {
          const formattedAddress = place.formatted_address;
          setInputValue(formattedAddress);
          onChange(formattedAddress);
          if (onAddressSelect) {
            onAddressSelect(formattedAddress);
          }
        } else if (place && place.name) {
          // Fallback to place name if formatted_address is not available
          setInputValue(place.name);
          onChange(place.name);
          if (onAddressSelect) {
            onAddressSelect(place.name);
          }
        }
      });
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${className}`}
        autoComplete="off"
      />
      {!isGoogleLoaded && (
        <div className="absolute right-2 top-2 text-gray-400 text-sm">
          Loading...
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
