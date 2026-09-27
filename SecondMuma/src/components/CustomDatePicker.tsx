import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Colors } from '../constants/theme';

interface CustomDatePickerProps {
    visible: boolean;
    onClose: () => void;
    value: Date | null;
    onChange: (date: Date) => void;
    minimumDate?: Date;
    maximumDate?: Date;
    accentColor?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
    visible,
    onClose,
    value,
    onChange,
    minimumDate = new Date(),
    maximumDate,
    accentColor = Colors.PRIMARY,
}) => {
    // Current viewed month/year in the calendar
    const [currentDate, setCurrentDate] = useState(() => value || new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Get days in the current month
    const getDaysInMonth = (y: number, m: number) => {
        return new Date(y, m + 1, 0).getDate();
    };

    // Get starting day index (0 = Sunday, 1 = Monday, etc.)
    const getFirstDayOfMonth = (y: number, m: number) => {
        return new Date(y, m, 1).getDay();
    };

    const daysInMonth = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month);

    // Date bounds (min date = today/minimumDate, max date = 6 months from minDate or maximumDate)
    const minDateLimit = new Date(minimumDate);
    minDateLimit.setHours(0, 0, 0, 0);

    const maxDateLimit = maximumDate
        ? new Date(maximumDate)
        : (() => {
            const d = new Date(minimumDate);
            d.setMonth(d.getMonth() + 6);
            return d;
        })();
    maxDateLimit.setHours(23, 59, 59, 999);

    // Month Navigation bounds
    const isPrevDisabled = (year < minDateLimit.getFullYear()) ||
        (year === minDateLimit.getFullYear() && month <= minDateLimit.getMonth());

    const isNextDisabled = (year > maxDateLimit.getFullYear()) ||
        (year === maxDateLimit.getFullYear() && month >= maxDateLimit.getMonth());

    // Grid cells array
    const cells: { date?: Date; label: string; isPadding: boolean; disabled: boolean }[] = [];

    // Padding cells for previous month
    for (let i = 0; i < firstDayIndex; i++) {
        cells.push({ label: '', isPadding: true, disabled: true });
    }

    // Current month cells
    for (let day = 1; day <= daysInMonth; day++) {
        const cellDate = new Date(year, month, day);
        cellDate.setHours(0, 0, 0, 0);

        const disabled = cellDate.getTime() < minDateLimit.getTime() || cellDate.getTime() > maxDateLimit.getTime();

        cells.push({
            date: cellDate,
            label: String(day),
            isPadding: false,
            disabled,
        });
    }

    const handlePrevMonth = () => {
        if (!isPrevDisabled) {
            setCurrentDate(new Date(year, month - 1, 1));
        }
    };

    const handleNextMonth = () => {
        if (!isNextDisabled) {
            setCurrentDate(new Date(year, month + 1, 1));
        }
    };

    const handleSelectDate = (date: Date) => {
        onChange(date);
        onClose();
    };

    const renderWeekDays = () => {
        const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        return (
            <View style={styles.weekdaysRow}>
                {weekdays.map((d, index) => (
                    <Text key={index} style={styles.weekdayText}>{d}</Text>
                ))}
            </View>
        );
    };

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerTitle}>Select Start Date</Text>
                            <Text style={styles.headerSubtitle}>Up to 6 months in advance</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Icon name="times" size={16} color={Colors.TEXT_SECONDARY} />
                        </TouchableOpacity>
                    </View>

                    {/* Month Picker Header */}
                    <View style={styles.monthHeader}>
                        <TouchableOpacity
                            onPress={handlePrevMonth}
                            disabled={isPrevDisabled}
                            style={[styles.navBtn, isPrevDisabled && styles.disabledNavBtn]}
                        >
                            <Icon name="chevron-left" size={12} color={isPrevDisabled ? Colors.TEXT_HINT : Colors.PRIMARY} />
                        </TouchableOpacity>
                        <Text style={styles.monthText}>{monthNames[month]} {year}</Text>
                        <TouchableOpacity
                            onPress={handleNextMonth}
                            disabled={isNextDisabled}
                            style={[styles.navBtn, isNextDisabled && styles.disabledNavBtn]}
                        >
                            <Icon name="chevron-right" size={12} color={isNextDisabled ? Colors.TEXT_HINT : Colors.PRIMARY} />
                        </TouchableOpacity>
                    </View>

                    {/* Weekdays */}
                    {renderWeekDays()}

                    {/* Calendar Grid */}
                    <View style={styles.grid}>
                        {cells.map((cell, index) => {
                            if (cell.isPadding) {
                                return <View key={`pad-${index}`} style={styles.gridCell} />;
                            }

                            const isSelected = value && 
                                value.getDate() === cell.date?.getDate() && 
                                value.getMonth() === cell.date?.getMonth() && 
                                value.getFullYear() === cell.date?.getFullYear();

                            return (
                                <TouchableOpacity
                                    key={`day-${cell.label}`}
                                    style={[
                                        styles.gridCell,
                                        isSelected && { backgroundColor: accentColor },
                                        cell.disabled && styles.disabledCell
                                    ]}
                                    disabled={cell.disabled}
                                    onPress={() => cell.date && handleSelectDate(cell.date)}
                                >
                                    <Text style={[
                                        styles.cellText,
                                        isSelected && styles.selectedCellText,
                                        cell.disabled && styles.disabledCellText
                                    ]}>
                                        {cell.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(13, 51, 51, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 20,
        width: '100%',
        maxWidth: 340,
        shadowColor: Colors.PRIMARY,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.DIVIDER,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    headerSubtitle: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    closeBtn: {
        padding: 4,
    },
    monthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 10,
    },
    navBtn: {
        padding: 10,
        borderRadius: 10,
        backgroundColor: Colors.PRIMARY_LIGHT,
    },
    disabledNavBtn: {
        backgroundColor: '#F3F4F6',
        opacity: 0.5,
    },
    monthText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    weekdaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 8,
    },
    weekdayText: {
        width: '14.28%',
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        marginVertical: 2,
    },
    cellText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    selectedCellText: {
        color: Colors.WHITE,
        fontWeight: '700',
    },
    disabledCell: {
        opacity: 0.3,
    },
    disabledCellText: {
        color: Colors.TEXT_HINT,
    },
});

export default CustomDatePicker;
