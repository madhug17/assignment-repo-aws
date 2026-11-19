import {HttpError} from "../models/error.js"
import {Availability} from "../models/availability.js"
import { Appointment } from "../models/appointment.js";
import moment from "moment";
import mongoose from "mongoose";



// Controller to set availability
const setAvailability = async (req, res, next) => {
  try {
    console.log(req.user);  // Log req.user to see if it's coming through
    
    const { startTime, endTime } = req.body;
    
    if (!req.user || !req.user.id) {
      return next(new HttpError("No professor ID found", 400));
    }

    // Ensure startTime is before endTime
    if (new Date(startTime) >= new Date(endTime)) {
      return next(new HttpError("Start time must be before end time", 400));
    }

    // Check for overlapping availability
    const existingAvailability = await Availability.findOne({
      professorId: req.user.id,
      $or: [
        { startTime: { $lt: new Date(endTime) }, endTime: { $gt: new Date(startTime) } }, // Start overlaps
        { startTime: { $lt: new Date(startTime) }, endTime: { $gt: new Date(endTime) } }  // End overlaps
      ]
      // New time starts before an old one finishes
      // New time finishes after an old one start
    });

    if (existingAvailability) {
      return next(new HttpError("This time slot is already added for you professor", 400));
    }

    // Create new availability entry
    const availability = new Availability({
      professorId: req.user.id,  // Ensure that professorId is coming from req.user._id
      startTime,
      endTime,
    });

    await availability.save();

    const formattedStartTime = moment.utc(availability.startTime).format('MMMM Do YYYY, h:mm:ss a');
    const formattedEndTime = moment.utc(availability.endTime).format('MMMM Do YYYY, h:mm:ss a');

    res.status(201).json({
      message: "Availability added successfully",
      availability: {
        ...availability.toObject(),  // Spreading existing availability data
        startTime: formattedStartTime, // Replacing with formatted date
        endTime: formattedEndTime, // Replacing  with formatted date
      },
    });
  } catch (error) {
    console.log(error);  // Log error for better debugging
    return next(new HttpError("Adding availability failed", 500));
  }
};



  const cancelAppointments = async(req,res,next) => {
    try {
      const { studentId } = req.params;  // Student's ID from params
      const professorId = req.user.id;   // Professor's ID from the authenticated user
      console.log('Professor ID:', professorId);  // This should match the professor's ID in the appointment
      console.log('Student ID:', studentId);

      // Ensuring professor is authenticated and studentId is provided /
      if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
        return next(new HttpError("Invalid or missing student ID", 400));
      }
  
      // Finding the  appointments between this professor and student
      const appointments = await Appointment.find({
        studentId: new mongoose.Types.ObjectId(studentId),
        professorId: new mongoose.Types.ObjectId(professorId),
        status: 'booked' // Only cancel booked appointments
      });
  
      if (!appointments || appointments.length === 0) {
        return next(new HttpError("No appointments found to cancel", 404));
      }
  
      // Updating the status of all appointments to "canceled"
      await Appointment.updateMany(
        {
          studentId: new mongoose.Types.ObjectId(studentId),
          professorId: new mongoose.Types.ObjectId(professorId),
          status: 'booked'
        },
        { status: 'cancelled' }  //  the status  needs to be cancelled
      );
  
      res.status(200).json({
        message: `All appointments between professor ${professorId} and student ${studentId} have been cancelled.`
      });
  
    } catch (error) {
      console.error("Error cancelling appointments:", error);
      return next(new HttpError(error));
    }
  };
const updateSlot = async (req, res, next) => {
  try {
    const { slotId } = req.params;
    const professorId = req.user.id;
    const { date, startTime, endTime } = req.body;

    // Validate slotId
    if (!slotId || !mongoose.Types.ObjectId.isValid(slotId)) {
      return next(new HttpError("Invalid or missing slot ID", 400));
    }

    // Validate required fields
    if (!date || !startTime || !endTime) {
      return next(new HttpError("Date, startTime and endTime are required", 400));
    }

    // Parse and validate the date and times
    const newStartTime = moment.utc(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm');
    const newEndTime = moment.utc(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm');

    if (!newStartTime.isValid() || !newEndTime.isValid()) {
      return next(new HttpError("Invalid date or time format. Use date: YYYY-MM-DD, time: HH:mm", 400));
    }

    if (newStartTime.isSameOrAfter(newEndTime)) {
      return next(new HttpError("Start time must be before end time", 400));
    }

    if (newStartTime.isBefore(moment.utc())) {
      return next(new HttpError("Cannot set availability in the past", 400));
    }

    // Find the existing slot
    const existingSlot = await Availability.findById(slotId);

    if (!existingSlot) {
      return next(new HttpError("Slot not found", 404));
    }

    // Check ownership
    if (existingSlot.professorId.toString() !== professorId) {
      return next(new HttpError("Unauthorized: You can only update your own slots", 403));
    }

    // Check if this slot has any booked appointments
    const bookedAppointment = await Appointment.findOne({
      professorId: new mongoose.Types.ObjectId(professorId),
      time: { $gte: existingSlot.startTime, $lte: existingSlot.endTime },
      status: 'booked'
    });

    if (bookedAppointment) {
      return next(new HttpError("Cannot update a slot that has booked appointments", 400));
    }

    // Check for overlapping slots (exclude current slot)
    const overlappingSlot = await Availability.findOne({
      professorId: new mongoose.Types.ObjectId(professorId),
      _id: { $ne: slotId },
      $or: [
        { startTime: { $lt: newEndTime.toDate() }, endTime: { $gt: newStartTime.toDate() } },
        { startTime: { $lt: newStartTime.toDate() }, endTime: { $gt: newEndTime.toDate() } }
      ]
    });

    if (overlappingSlot) {
      return next(new HttpError("Updated time overlaps with an existing slot", 400));
    }

    // Update the existing document in place (preserving _id)
    const updatedSlot = await Availability.findByIdAndUpdate(
      slotId,
      {
        startTime: newStartTime.toDate(),
        endTime: newEndTime.toDate()
      },
      { new: true, runValidators: true }
    );

    const formattedStartTime = moment.utc(updatedSlot.startTime).format('MMMM Do YYYY, h:mm:ss a');
    const formattedEndTime = moment.utc(updatedSlot.endTime).format('MMMM Do YYYY, h:mm:ss a');

    res.status(200).json({
      message: "Availability slot updated successfully",
      availability: {
        ...updatedSlot.toObject(),
        startTime: formattedStartTime,
        endTime: formattedEndTime,
      },
    });
  } catch (error) {
    console.error("Error updating slot:", error);
    return next(new HttpError("Failed to update availability slot", 500));
  }
};

export {setAvailability, cancelAppointments, updateSlot};