import React, { useState, useEffect, useRef } from 'react';

const AddressAutocomplete = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  onAddressSelect 
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsGoogleLoaded(true);
      initializeAutocomplete();
    } else {
      // Load Google Maps JavaScript API with Places library
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      
      // Set up global callback
      window.initGoogleMaps = () => {
        setIsGoogleLoaded(true);
        initializeAutocomplete();
      };

      document.head.appendChild(script);

      return () => {
        // Cleanup: remove script and callback
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
        if (window.initGoogleMaps) {
          delete window.initGoogleMaps;
        }
      };
    }
  }, []);

  useEffect(() => {
    if (isGoogleLoaded && inputRef.current) {
      initializeAutocomplete();
    }
  }, [isGoogleLoaded]);

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    try {
      // Create the autocomplete object
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
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
    <div className="relative">
      <input
        ref={inputRef}
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
