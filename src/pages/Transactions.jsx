import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  Skeleton,
  Box,
  TablePagination,
} from '@mui/material';
import { styled } from '@mui/system';
import { format } from 'date-fns';
import { getUserTransactions } from '../api/userApi';
import { motion } from 'framer-motion';

// 🎨 **Styled Components**
const StyledContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  background: '#f5f7fa',
  padding: theme.spacing(4),
  boxSizing: 'border-box',
  overflowX: 'hidden',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: '1200px',
  padding: theme.spacing(3),
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  borderRadius: '8px',
  background: '#fff',
  overflow: 'hidden',
  marginTop: '-3vh', // Move table slightly upwards
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: '#e3f2fd',
  position: 'sticky',
  top: 0,
  zIndex: 1,
}));

const StyledTableCellHeader = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  color: '#333',
  fontSize: '1.03rem',
  textTransform: 'uppercase',
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(even)': {
    backgroundColor: '#fafafa',
  },
  '&:hover': {
    backgroundColor: '#f1f8ff',
  },
  transition: 'background-color 0.3s ease',
}));

const StyledSkeletonRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(1),
}));

// ✨ **Animation Variants**
const pageVariants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, y: -50, transition: { duration: 0.5, ease: 'easeIn' } },
};

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    (async () => {
      try {
        const data = await getUserTransactions();
        setTransactions(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load transactions');
        setShowSnackbar(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCloseSnackbar = () => setShowSnackbar(false);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Paginated data
  const paginatedTransactions = transactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <StyledContainer>
        <StyledPaper>
          {/* Snackbar for Error Messages */}
          <Snackbar
            open={showSnackbar}
            autoHideDuration={4000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          </Snackbar>

          {/* Page Title */}
          <Typography variant="h5" fontWeight="bold" gutterBottom textAlign="center">
            📑 Transaction History
          </Typography>

          {/* Loading State with Skeleton */}
          {loading ? (
            <Box>
              {[...Array(5)].map((_, index) => (
                <StyledSkeletonRow key={index}>
                  <Skeleton variant="text" width="10%" height={30} />
                  <Skeleton variant="text" width="15%" height={30} />
                  <Skeleton variant="text" width="10%" height={30} />
                  <Skeleton variant="text" width="10%" height={30} />
                  <Skeleton variant="text" width="10%" height={30} />
                  <Skeleton variant="text" width="15%" height={30} />
                  <Skeleton variant="text" width="20%" height={30} />
                </StyledSkeletonRow>
              ))}
            </Box>
          ) : transactions.length === 0 ? (
            <Typography textAlign="center" mt={4}>
              No transactions found.
            </Typography>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: '500px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', margin: '16px 0' }}>
                <Table stickyHeader>
                  <StyledTableHead>
                    <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                      <StyledTableCellHeader sx={{ fontWeight: 'bold', fontSize: '0.9rem', padding: '8px' }}>#</StyledTableCellHeader>
                      <StyledTableCellHeader sx={{ fontWeight: 'bold', fontSize: '0.9rem', padding: '8px' }}>Stock Ticker</StyledTableCellHeader>
                      <StyledTableCellHeader sx={{ fontWeight: 'bold', fontSize: '0.9rem', padding: '8px' }}>Direction</StyledTableCellHeader>
                      <StyledTableCellHeader sx={{ fontWeight: 'bold', fontSize: '0.9rem', padding: '8px' }}>Quantity</StyledTableCellHeader>
                      <StyledTableCellHeader sx={{ fontWeight: 'bold', fontSize: '0.9rem', padding: '8px' }}>Execution Price</StyledTableCellHeader>
                      <StyledTableCellHeader sx={{ fontWeight: 'bold', fontSize: '0.9rem', padding: '8px' }}>Transaction Fee</StyledTableCellHeader>
                      <StyledTableCellHeader sx={{ fontWeight: 'bold', fontSize: '0.9rem', padding: '8px' }}>Trade Date</StyledTableCellHeader>
                    </TableRow>
                  </StyledTableHead>
                  <TableBody>
                    {paginatedTransactions.map((tx, index) => {
                      const createdAt = tx.created_at
                        ? format(new Date(tx.created_at), 'dd MMM yy')
                        : 'N/A';
                      const createdAtTime = tx.created_at
                        ? format(new Date(tx.created_at), 'hh:mm a')
                        : '';
                      return (
                        <StyledTableRow key={tx.id} sx={{
                          '&:nth-of-type(odd)': { backgroundColor: '#f3f3f3' },
                          '&:hover': { backgroundColor: '#fbfbfb' },
                          height: '40px'
                        }}>
                          <TableCell sx={{ fontSize: '0.9rem', padding: '6px' }}>{index + 1 + page * rowsPerPage}</TableCell>
                          <TableCell sx={{ fontSize: '0.9rem', fontWeight: '500', padding: '6px' }}>{tx.stock_ticker}</TableCell>
                          <TableCell sx={{ fontSize: '0.9rem', textTransform: 'capitalize', padding: '6px' }}>{tx.direction}</TableCell>
                          <TableCell sx={{ fontSize: '0.9rem', padding: '6px' }}>{tx.quantity}</TableCell>
                          <TableCell sx={{ fontSize: '0.9rem', padding: '6px' }}>${tx.execution_price}</TableCell>
                          <TableCell sx={{ fontSize: '0.9rem', padding: '6px' }}>${tx.transaction_fee}</TableCell>
                          <TableCell sx={{ fontSize: '0.9rem', color: 'black', padding: '6px' }}>
                            {createdAt}
                            <div style={{ fontSize: '0.8rem', color: '#777' }}>{createdAtTime}</div>
                          </TableCell>
                        </StyledTableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <TablePagination
                component="div"
                count={transactions.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </StyledPaper>
      </StyledContainer>
    </motion.div>
  );
}

export default Transactions;
