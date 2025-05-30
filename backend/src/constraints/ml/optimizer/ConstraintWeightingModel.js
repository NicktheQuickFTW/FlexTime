/**
 * Constraint Weighting Model
 * ML model for dynamic constraint weight optimization
 */

const tf = require('@tensorflow/tfjs-node');
const EventEmitter = require('events');

class ConstraintWeightingModel extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            modelType: 'neural_network',
            hiddenLayers: [128, 64, 32],
            learningRate: 0.001,
            batchSize: 32,
            epochs: 100,
            validationSplit: 0.2,
            dropoutRate: 0.3,
            regularization: 0.001,
            ...options
        };

        this.model = null;
        this.isTraining = false;
        this.trainingHistory = [];
        this.featureScaler = null;
        this.labelScaler = null;
        
        // Model versioning
        this.version = '1.0.0';
        this.lastTrainingDate = null;
        this.trainingMetrics = {
            accuracy: 0,
            loss: 0,
            valAccuracy: 0,
            valLoss: 0
        };

        this.initializeModel();
    }

    /**
     * Initialize the neural network model
     */
    async initializeModel() {
        try {
            this.model = tf.sequential({
                layers: [
                    // Input layer with feature dimensions
                    tf.layers.dense({
                        units: this.options.hiddenLayers[0],
                        activation: 'relu',
                        inputShape: [this.getFeatureDimensions()],
                        kernelRegularizer: tf.regularizers.l2({ l2: this.options.regularization })
                    }),
                    
                    // Dropout for regularization
                    tf.layers.dropout({ rate: this.options.dropoutRate }),
                    
                    // Hidden layers
                    ...this.options.hiddenLayers.slice(1).map(units => [
                        tf.layers.dense({
                            units,
                            activation: 'relu',
                            kernelRegularizer: tf.regularizers.l2({ l2: this.options.regularization })
                        }),
                        tf.layers.dropout({ rate: this.options.dropoutRate })
                    ]).flat(),
                    
                    // Output layer for weight predictions
                    tf.layers.dense({
                        units: this.getOutputDimensions(),
                        activation: 'sigmoid' // Normalized weights between 0 and 1
                    })
                ]
            });

            // Compile model
            this.model.compile({
                optimizer: tf.train.adam(this.options.learningRate),
                loss: 'meanSquaredError',
                metrics: ['accuracy', 'meanAbsoluteError']
            });

            console.log('Constraint weighting model initialized');
            this.emit('model-initialized', { version: this.version });

        } catch (error) {
            console.error('Error initializing constraint weighting model:', error);
            this.emit('model-error', error);
            throw error;
        }
    }

    /**
     * Train the model with historical data
     */
    async train(trainingData) {
        if (this.isTraining) {
            throw new Error('Model is already training');
        }

        this.isTraining = true;
        this.emit('training-started', { dataSize: trainingData.length });

        try {
            // Prepare training data
            const { features, labels } = this.prepareTrainingData(trainingData);

            // Scale features and labels
            const scaledFeatures = this.scaleFeatures(features);
            const scaledLabels = this.scaleLabels(labels);

            // Convert to tensors
            const featureTensor = tf.tensor2d(scaledFeatures);
            const labelTensor = tf.tensor2d(scaledLabels);

            // Training callbacks
            const callbacks = {
                onEpochEnd: (epoch, logs) => {
                    this.emit('training-progress', {
                        epoch: epoch + 1,
                        totalEpochs: this.options.epochs,
                        loss: logs.loss,
                        accuracy: logs.acc || logs.accuracy,
                        valLoss: logs.val_loss,
                        valAccuracy: logs.val_acc || logs.val_accuracy
                    });
                },
                onTrainEnd: () => {
                    this.emit('training-completed', {
                        version: this.version,
                        metrics: this.trainingMetrics
                    });
                }
            };

            // Train the model
            const history = await this.model.fit(featureTensor, labelTensor, {
                epochs: this.options.epochs,
                batchSize: this.options.batchSize,
                validationSplit: this.options.validationSplit,
                shuffle: true,
                callbacks
            });

            // Update training metrics
            const finalMetrics = history.history;
            this.trainingMetrics = {
                accuracy: finalMetrics.acc?.slice(-1)[0] || finalMetrics.accuracy?.slice(-1)[0] || 0,
                loss: finalMetrics.loss?.slice(-1)[0] || 0,
                valAccuracy: finalMetrics.val_acc?.slice(-1)[0] || finalMetrics.val_accuracy?.slice(-1)[0] || 0,
                valLoss: finalMetrics.val_loss?.slice(-1)[0] || 0
            };

            this.lastTrainingDate = new Date();
            this.trainingHistory.push({
                date: this.lastTrainingDate,
                metrics: this.trainingMetrics,
                dataSize: trainingData.length
            });

            // Cleanup tensors
            featureTensor.dispose();
            labelTensor.dispose();

            console.log('Model training completed:', this.trainingMetrics);
            return this.trainingMetrics;

        } catch (error) {
            console.error('Error during model training:', error);
            this.emit('training-error', error);
            throw error;
        } finally {
            this.isTraining = false;
        }
    }

    /**
     * Predict optimal weights for constraints
     */
    async predictOptimalWeight(constraintId, context) {
        if (!this.model) {
            throw new Error('Model not initialized');
        }

        try {
            // Extract features from context
            const features = this.extractPredictionFeatures(constraintId, context);
            const scaledFeatures = this.scaleFeatures([features]);

            // Make prediction
            const featureTensor = tf.tensor2d(scaledFeatures);
            const prediction = await this.model.predict(featureTensor);
            const weights = await prediction.data();

            // Cleanup
            featureTensor.dispose();
            prediction.dispose();

            // Extract weight for specific constraint
            const constraintIndex = this.getConstraintIndex(constraintId);
            const optimalWeight = weights[constraintIndex] || 1.0;

            // Denormalize weight
            return this.denormalizeWeight(optimalWeight);

        } catch (error) {
            console.error('Error predicting optimal weight:', error);
            return 1.0; // Default weight
        }
    }

    /**
     * Predict optimal modifications for schedule
     */
    async predictOptimalModifications(features, currentSolution, weights) {
        if (!this.model) {
            return {}; // Return empty modifications if model not ready
        }

        try {
            // Prepare feature vector for modification prediction
            const modificationFeatures = this.extractModificationFeatures(
                features, 
                currentSolution, 
                weights
            );

            const scaledFeatures = this.scaleFeatures([modificationFeatures]);
            const featureTensor = tf.tensor2d(scaledFeatures);

            // Get prediction
            const prediction = await this.model.predict(featureTensor);
            const modifications = await prediction.data();

            // Cleanup
            featureTensor.dispose();
            prediction.dispose();

            // Convert predictions to constraint modifications
            return this.convertToModifications(modifications, weights);

        } catch (error) {
            console.error('Error predicting optimal modifications:', error);
            return {};
        }
    }

    /**
     * Predict acceptance enhancement factor
     */
    async predictAcceptanceEnhancement(features, currentSolution, candidateSolution, optimizationContext) {
        try {
            // Extract features for acceptance prediction
            const acceptanceFeatures = this.extractAcceptanceFeatures(
                features,
                currentSolution,
                candidateSolution,
                optimizationContext
            );

            // Use a simpler heuristic if model is not ready
            if (!this.model) {
                return this.calculateHeuristicEnhancement(acceptanceFeatures);
            }

            const scaledFeatures = this.scaleFeatures([acceptanceFeatures]);
            const featureTensor = tf.tensor2d(scaledFeatures);

            const prediction = await this.model.predict(featureTensor);
            const enhancement = await prediction.data();

            // Cleanup
            featureTensor.dispose();
            prediction.dispose();

            // Return enhancement factor (0.5 to 2.0)
            return Math.max(0.5, Math.min(2.0, enhancement[0] || 1.0));

        } catch (error) {
            console.error('Error predicting acceptance enhancement:', error);
            return 1.0; // Neutral enhancement
        }
    }

    /**
     * Prepare training data from historical feedback
     */
    prepareTrainingData(trainingData) {
        const features = [];
        const labels = [];

        for (const data of trainingData) {
            try {
                // Extract feature vector
                const featureVector = this.extractTrainingFeatures(data);
                const labelVector = this.extractTrainingLabels(data);

                features.push(featureVector);
                labels.push(labelVector);
            } catch (error) {
                console.warn('Error preparing training sample:', error);
            }
        }

        return { features, labels };
    }

    /**
     * Extract features for training
     */
    extractTrainingFeatures(data) {
        return [
            // Schedule complexity features
            data.features.gameCount || 0,
            data.features.teamCount || 0,
            data.features.venueCount || 0,
            data.features.constraintCount || 0,
            
            // Temporal features
            data.features.seasonLength || 0,
            data.features.championshipCount || 0,
            data.features.holidayCount || 0,
            
            // Constraint violation features
            data.violations.length || 0,
            data.violations.filter(v => v.severity === 'high').length || 0,
            data.violations.filter(v => v.severity === 'medium').length || 0,
            
            // Historical performance
            data.features.historicalSatisfaction || 0,
            data.features.averageOptimizationTime || 0,
            data.features.previousConstraintViolations || 0,
            
            // Context features
            data.features.sportType === 'football' ? 1 : 0,
            data.features.sportType === 'basketball' ? 1 : 0,
            data.features.isConferenceSchedule ? 1 : 0
        ];
    }

    /**
     * Extract labels for training
     */
    extractTrainingLabels(data) {
        // Extract optimal weights based on satisfaction and violations
        const baseWeights = Object.values(data.weights);
        const satisfaction = data.satisfaction || 0;
        const violationPenalty = (data.violations.length || 0) * 0.1;

        // Adjust weights based on performance
        return baseWeights.map(weight => {
            const adjustedWeight = weight * (satisfaction - violationPenalty);
            return Math.max(0, Math.min(2, adjustedWeight)); // Clamp between 0 and 2
        });
    }

    /**
     * Scale features using min-max normalization
     */
    scaleFeatures(features) {
        if (!this.featureScaler) {
            this.featureScaler = this.createFeatureScaler(features);
        }

        return features.map(featureVector => 
            featureVector.map((value, index) => {
                const { min, max } = this.featureScaler[index];
                return max > min ? (value - min) / (max - min) : 0;
            })
        );
    }

    /**
     * Scale labels using min-max normalization
     */
    scaleLabels(labels) {
        if (!this.labelScaler) {
            this.labelScaler = this.createLabelScaler(labels);
        }

        return labels.map(labelVector =>
            labelVector.map((value, index) => {
                const { min, max } = this.labelScaler[index];
                return max > min ? (value - min) / (max - min) : 0;
            })
        );
    }

    /**
     * Create feature scaler
     */
    createFeatureScaler(features) {
        const scaler = [];
        const featureCount = features[0]?.length || 0;

        for (let i = 0; i < featureCount; i++) {
            const values = features.map(f => f[i] || 0);
            scaler[i] = {
                min: Math.min(...values),
                max: Math.max(...values)
            };
        }

        return scaler;
    }

    /**
     * Create label scaler
     */
    createLabelScaler(labels) {
        const scaler = [];
        const labelCount = labels[0]?.length || 0;

        for (let i = 0; i < labelCount; i++) {
            const values = labels.map(l => l[i] || 0);
            scaler[i] = {
                min: Math.min(...values),
                max: Math.max(...values)
            };
        }

        return scaler;
    }

    /**
     * Get feature dimensions for model input
     */
    getFeatureDimensions() {
        return 16; // Number of features in training data
    }

    /**
     * Get output dimensions for model output
     */
    getOutputDimensions() {
        return 10; // Number of constraint types/weights to predict
    }

    /**
     * Get constraint index for weight extraction
     */
    getConstraintIndex(constraintId) {
        // Map constraint IDs to indices
        const constraintMapping = {
            'time_constraint': 0,
            'venue_constraint': 1,
            'travel_constraint': 2,
            'resource_constraint': 3,
            'championship_constraint': 4,
            'rest_constraint': 5,
            'rivalry_constraint': 6,
            'tv_constraint': 7,
            'weather_constraint': 8,
            'default': 9
        };

        return constraintMapping[constraintId] || constraintMapping.default;
    }

    /**
     * Denormalize weight from model output
     */
    denormalizeWeight(normalizedWeight) {
        // Convert from [0,1] to [0.1, 3.0] range
        return 0.1 + (normalizedWeight * 2.9);
    }

    /**
     * Calculate heuristic enhancement when model is not available
     */
    calculateHeuristicEnhancement(features) {
        // Simple heuristic based on constraint violations and satisfaction
        const violationCount = features.violationCount || 0;
        const satisfaction = features.satisfaction || 0;
        
        if (violationCount > 0) {
            return 0.7; // Reduce acceptance for solutions with violations
        }
        
        if (satisfaction > 0.8) {
            return 1.3; // Increase acceptance for high satisfaction
        }
        
        return 1.0; // Neutral
    }

    /**
     * Save model to file
     */
    async saveModel(filepath) {
        if (!this.model) {
            throw new Error('No model to save');
        }

        try {
            await this.model.save(`file://${filepath}`);
            console.log(`Model saved to ${filepath}`);
        } catch (error) {
            console.error('Error saving model:', error);
            throw error;
        }
    }

    /**
     * Load model from file
     */
    async loadModel(filepath) {
        try {
            this.model = await tf.loadLayersModel(`file://${filepath}`);
            console.log(`Model loaded from ${filepath}`);
            this.emit('model-loaded', { filepath });
        } catch (error) {
            console.error('Error loading model:', error);
            this.emit('model-error', error);
            throw error;
        }
    }

    /**
     * Get model metrics
     */
    getMetrics() {
        return {
            version: this.version,
            lastTrainingDate: this.lastTrainingDate,
            trainingMetrics: this.trainingMetrics,
            trainingHistory: this.trainingHistory,
            isTraining: this.isTraining
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.model) {
            this.model.dispose();
            this.model = null;
        }
        this.removeAllListeners();
    }
}

module.exports = { ConstraintWeightingModel };