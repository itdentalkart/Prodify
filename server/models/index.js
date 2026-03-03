const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrganizationSchema = new Schema({
  name:                  { type: String, required: true },
  domain:                { type: String },
  screenshotIntervalSec: { type: Number, default: 300 },
  idleThresholdSec:      { type: Number, default: 300 },
  workingHours:          { type: String, default: '09:00-18:00' },
  retentionDays:         { type: Number, default: 30 },
}, { timestamps: true });

const UserSchema = new Schema({
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  displayName:  { type: String },
  orgId:        { type: Schema.Types.ObjectId, ref: 'Organization' },
  role:         { type: String, enum: ['super_admin','admin','it','employee'], default: 'employee' },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

const DeviceSchema = new Schema({
  orgId:          { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  hostname:       { type: String, required: true },
  deviceType:     { type: String, default: 'Desktop' },
  os:             { type: String },
  ipAddress:      { type: String },
  agentVersion:   { type: String },
  agentToken:     { type: String, unique: true, sparse: true },
  lastSeen:       { type: Date },
  status:         { type: String, enum: ['online','idle','offline'], default: 'offline' },
  location:       { type: String },
  assignedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const SessionSchema = new Schema({
  deviceId:     { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  userId:       { type: Schema.Types.ObjectId, ref: 'User' },
  sessionStart: { type: Date, default: Date.now },
  sessionEnd:   { type: Date },
  activeSeconds:{ type: Number, default: 0 },
  idleSeconds:  { type: Number, default: 0 },
}, { timestamps: true });

const ScreenshotSchema = new Schema({
  deviceId:   { type: Schema.Types.ObjectId, ref: 'Device', required: true },
  orgId:      { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  sessionId:  { type: Schema.Types.ObjectId, ref: 'Session' },
  filePath:   { type: String, required: true },
  fileSize:   { type: Number },
  capturedAt: { type: Date, default: Date.now },
  hash:       { type: String },
}, { timestamps: true });

const TelemetryEventSchema = new Schema({
  deviceId:  { type: Schema.Types.ObjectId, ref: 'Device' },
  orgId:     { type: Schema.Types.ObjectId, ref: 'Organization' },
  eventType: { type: String, required: true },
  eventTime: { type: Date, default: Date.now },
  details:   { type: Schema.Types.Mixed },
}, { timestamps: true });

const EnrollmentTokenSchema = new Schema({
  token:          { type: String, required: true, unique: true },
  orgId:          { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  expiresAt:      { type: Date, required: true },
  usedAt:         { type: Date },
  usedByDeviceId: { type: Schema.Types.ObjectId, ref: 'Device' },
  label:          { type: String },
}, { timestamps: true });

const LicenseSchema = new Schema({
  orgId:         { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
  totalLicenses: { type: Number, default: 0 },
  usedLicenses:  { type: Number, default: 0 },
  status:        { type: String, enum: ['active','suspended','expired'], default: 'active' },
  expiresAt:     { type: Date },
}, { timestamps: true });

const AuditLogSchema = new Schema({
  orgId:        { type: Schema.Types.ObjectId, ref: 'Organization' },
  userId:       { type: Schema.Types.ObjectId, ref: 'User' },
  action:       { type: String, required: true },
  resourceType: { type: String },
  resourceId:   { type: String },
  details:      { type: Schema.Types.Mixed },
  ipAddress:    { type: String },
}, { timestamps: true });

module.exports = {
  Organization:    mongoose.model('Organization',    OrganizationSchema),
  User:            mongoose.model('User',            UserSchema),
  Device:          mongoose.model('Device',          DeviceSchema),
  Session:         mongoose.model('Session',         SessionSchema),
  Screenshot:      mongoose.model('Screenshot',      ScreenshotSchema),
  TelemetryEvent:  mongoose.model('TelemetryEvent',  TelemetryEventSchema),
  EnrollmentToken: mongoose.model('EnrollmentToken', EnrollmentTokenSchema),
  License:         mongoose.model('License',         LicenseSchema),
  AuditLog:        mongoose.model('AuditLog',        AuditLogSchema),
};
